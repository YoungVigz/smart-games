// Runs only against its own disposable PostgreSQL container, never DATABASE_URL from .env.
const { before, after, test } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { randomUUID } = require("node:crypto");
const { Pool } = require("pg");
const { EventEmitter2 } = require("@nestjs/event-emitter");
const { PrismaService } = require("../dist/prisma/prisma.service");
const { GamesService } = require("../dist/src/games/games.service");

const name = `smart-games-history-test-${randomUUID().slice(0, 8)}`;
let prisma, pool, service;
const events = new EventEmitter2();
let eventCount = 0;
events.on("user.xp_updated", () => eventCount++);
const docker = (...args) =>
	execFileSync("docker", args, {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const input = (id = randomUUID()) => ({
	id,
	gameKey: "sudoku",
	modeKey: "solo",
	difficulty: "medium",
	reason: "SOLVED",
	startedAt: new Date(),
	durationSeconds: 60,
	participants: [
		{ userId: "player-one", outcome: "WIN", errors: 2, timeElapsed: 60 },
	],
});

before(
	async () => {
		docker(
			"run",
			"--rm",
			"-d",
			"--name",
			name,
			"-p",
			"127.0.0.1::5432",
			"-e",
			"POSTGRES_PASSWORD=test-password",
			"postgres:16-alpine",
		);
		const address = docker("port", name, "5432/tcp");
		const port = address.split(":").at(-1);
		const url = `postgresql://postgres:test-password@127.0.0.1:${port}/postgres`;
		process.env.DATABASE_URL = url;
		pool = new Pool({ connectionString: url });
		for (let attempt = 0; ; attempt++) {
			try {
				await pool.query("SELECT 1");
				break;
			} catch (error) {
				if (attempt >= 60) throw error;
				await sleep(500);
			}
		}
		// Exercise upgrading an existing installation, including its historical data.
		await pool.query(
			readFileSync(
				"prisma/migrations/20261115000000_baseline/migration.sql",
				"utf8",
			),
		);
		await pool.query(`INSERT INTO "User" (id, login, email, password, xp, "updatedAt") VALUES
    ('player-one', 'one', 'one@test.local', 'unused', 1000, now()),
    ('player-two', 'two', 'two@test.local', 'unused', 0, now());
    INSERT INTO "SudokuGame" (id, "userId", difficulty, status, errors, "timeElapsed", "updatedAt")
    VALUES ('legacy-game', 'player-one', 'EASY', 'COMPLETED', 0, 30, now());`);
		const cli = require.resolve("prisma/build/index.js");
		execFileSync(
			process.execPath,
			[cli, "migrate", "resolve", "--applied", "20261115000000_baseline"],
			{ env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" },
		);
		execFileSync(process.execPath, [cli, "migrate", "deploy"], {
			env: { ...process.env, DATABASE_URL: url },
			stdio: "pipe",
		});
		prisma = new PrismaService();
		await prisma.$connect();
		service = new GamesService(prisma, events);
	},
	{ timeout: 60000 },
);

after(async () => {
	if (prisma) await prisma.$disconnect();
	if (pool) await pool.end();
	try {
		docker("rm", "-f", name);
	} catch {
		/* Container may not have started. */
	}
});

test("migration preserves historical stats without guessing old XP", async () => {
	const stats = await service.statistics("player-one", {
		gameKey: "sudoku",
		modeKey: "solo",
	});
	assert.equal(stats.gamesPlayed, 1);
	assert.equal(stats.timeElapsed, 30);
	assert.equal(stats.recordedXp, 0);
	assert.equal(stats.gamesWithRecordedXp, 0);
	const history = await service.history("player-one", {});
	assert.equal(history[0].xpGained, null);
	assert.equal(
		(await prisma.user.findUnique({ where: { id: "player-one" } })).xp,
		1000,
	);
});
test("replayed and concurrent completions award XP exactly once", async () => {
	const game = input();
	const results = await Promise.all(
		Array.from({ length: 8 }, () => service.finalize(game)),
	);
	assert.ok(results.every(result => result.participants[0].xpGained === 200));
	assert.equal(await prisma.gameSession.count({ where: { id: game.id } }), 1);
	assert.equal(await prisma.sudokuGame.count({ where: { id: game.id } }), 1);
	assert.equal(
		(await prisma.user.findUnique({ where: { id: "player-one" } })).xp,
		1200,
	);
});
test("a participant failure rolls back the entire PvP settlement", async () => {
	const game = input();
	game.modeKey = "pvp";
	game.participants.push({
		userId: "missing-user",
		outcome: "LOSS",
		errors: 3,
		timeElapsed: 60,
	});
	const previousEvents = eventCount;
	await assert.rejects(service.finalize(game));
	assert.equal(await prisma.gameSession.count({ where: { id: game.id } }), 0);
	assert.equal(
		(await prisma.user.findUnique({ where: { id: "player-one" } })).xp,
		1200,
	);
	assert.equal(eventCount, previousEvents);
});
test("PvP persists both outcomes and stats stay scoped to the selected mode", async () => {
	const game = input();
	game.modeKey = "pvp";
	game.participants.push({
		userId: "player-two",
		outcome: "LOSS",
		errors: 3,
		timeElapsed: 60,
	});
	await service.finalize(game);
	const winner = await service.statistics("player-one", { modeKey: "pvp" });
	const loser = await service.statistics("player-two", { modeKey: "pvp" });
	assert.equal(winner.wins, 1);
	assert.equal(winner.recordedXp, 200);
	assert.equal(loser.wins, 0);
	assert.equal(loser.recordedXp, 0);
	const solo = await service.statistics("player-one", { modeKey: "solo" });
	assert.equal(solo.gamesPlayed, 2);
	const details = await service.details("player-two", game.id);
	assert.equal(details.participants.length, 2);
	assert.equal(
		details.participants.find(p => p.userId === "player-one").user.login,
		"one",
	);
	assert.ok(details.participants.every(p => !("password" in p.user)));
	await assert.rejects(
		service.details("unrelated-player", game.id),
		/Game result not found/,
	);
	const first = await service.history("player-one", {}, 1);
	const next = await service.history("player-one", {}, 1, first[0].sessionId);
	assert.equal(first.length, 1);
	assert.equal(next.length, 1);
	assert.notEqual(first[0].sessionId, next[0].sessionId);
});

test("XP update failure rolls back the already created result and participants", async () => {
	const game = input();
	game.participants[0].userId = "player-two";
	await prisma.user.update({
		where: { id: "player-two" },
		data: { xp: 2147483647 },
	});
	const previousEvents = eventCount;
	await assert.rejects(service.finalize(game));
	assert.equal(await prisma.gameSession.count({ where: { id: game.id } }), 0);
	assert.equal(
		await prisma.gameParticipant.count({ where: { sessionId: game.id } }),
		0,
	);
	assert.equal(
		(await prisma.user.findUnique({ where: { id: "player-two" } })).xp,
		2147483647,
	);
	assert.equal(eventCount, previousEvents);
});
