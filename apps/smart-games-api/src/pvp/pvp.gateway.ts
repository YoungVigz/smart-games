import { randomUUID } from "node:crypto";
import { assertMove, isBoardComplete } from "@smart-games/game-engine/sudoku";
import type { SudokuBoard, MatrixBoard } from "@smart-games/game-engine";
import { GamesService } from "../games/games.service";
import { withRedisLock } from "../common/utils/redis-lock";
import { Inject } from "@nestjs/common";
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import Redis from "ioredis";
import { Server, Socket } from "socket.io";
import { SudokuService } from "src/sudoku/sudoku.service";

interface MatchState {
	matchId: string;
	solution: MatrixBoard;
	players: string[];
	status: string;
	startedAt?: string;
	initialEmptyCells?: number;
	terminal?: { triggerUserId: string; reason: "WINNER" | "DISQUALIFIED" };
}
interface PlayerState {
	board: SudokuBoard;
	errors: number;
}
@WebSocketGateway({
	cors: { origin: "*" },
	namespace: "pvp",
})
export class PvpGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() server!: Server;
	private activeConnections = new Map<string, string>();

	constructor(
		@Inject("REDIS_CLIENT") private readonly redis: Redis,
		private readonly sudokuService: SudokuService,
		private readonly games: GamesService,
	) {}

	private readonly QUEUE_KEY = "pvp:queue";

	async handleConnection(client: Socket) {
		const userId = client.handshake.auth.userId;
		if (!userId) return client.disconnect();
		client.data.userId = userId;
		this.activeConnections.set(userId, client.id);
	}

	async handleDisconnect(client: Socket) {
		const userId = client.data.userId;
		if (userId) {
			await this.redis.lrem(this.QUEUE_KEY, 0, userId);
			this.activeConnections.delete(userId);
		}
	}

	@SubscribeMessage("join_queue")
	async handleJoinQueue(client: Socket) {
		const userId = client.data.userId;
		await this.redis.lrem(this.QUEUE_KEY, 0, userId);
		await this.redis.rpush(this.QUEUE_KEY, userId);
		const queueLen = await this.redis.llen(this.QUEUE_KEY);
		if (queueLen >= 2) {
			const p1Id = await this.redis.lpop(this.QUEUE_KEY);
			const p2Id = await this.redis.lpop(this.QUEUE_KEY);
			if (p1Id && p2Id) await this.startMatch(p1Id, p2Id);
		} else {
			client.emit("queue_status", { status: "waiting" });
		}
	}

	@SubscribeMessage("leave_queue")
	async handleLeaveQueue(client: Socket) {
		await this.redis.lrem(this.QUEUE_KEY, 0, client.data.userId);
		client.emit("queue_status", { status: "idle" });
	}

	private async startMatch(p1Id: string, p2Id: string) {
		const matchId = `match:${randomUUID()}`;
		const { board, solution } =
			await this.sudokuService.preparePvpGame("medium");
		const matchState: MatchState = {
			matchId,
			startedAt: new Date().toISOString(),
			initialEmptyCells: board.flat().filter(cell => cell.value === null)
				.length,
			solution,
			players: [p1Id, p2Id],
			status: "PLAYING",
		};
		await this.redis.setex(
			`pvp:${matchId}:meta`,
			3600,
			JSON.stringify(matchState),
		);

		for (const pid of [p1Id, p2Id]) {
			const playerState = { board, errors: 0 };
			await this.redis.setex(
				`pvp:${matchId}:player:${pid}`,
				3600,
				JSON.stringify(playerState),
			);
			await this.redis.setex(
				`pvp:player:${pid}:active_match`,
				3600,
				matchId,
			);
		}

		const s1Id = this.activeConnections.get(p1Id);
		const s2Id = this.activeConnections.get(p2Id);
		if (s1Id && s2Id) {
			this.server.in(s1Id).socketsJoin(matchId);
			this.server.in(s2Id).socketsJoin(matchId);
			this.server.to(matchId).emit("match_found", {
				matchId,
				board,
				opponents: [p1Id, p2Id],
			});
		}
	}

	@SubscribeMessage("pvp_move")
	async handleMove(
		client: Socket,
		payload: { row: number; col: number; value: number | null },
	) {
		const userId = client.data.userId;
		const matchId = await this.redis.get(
			`pvp:player:${userId}:active_match`,
		);
		if (!matchId) return;

		return withRedisLock(this.redis, "pvp:lock:" + matchId, () =>
			this.applyMove(client, payload, userId, matchId),
		);
	}
	private async applyMove(
		client: Socket,
		payload: { row: number; col: number; value: number | null },
		userId: string,
		matchId: string,
	) {
		try {
			assertMove(payload.row, payload.col, payload.value);
		} catch {
			client.emit("move_error", { message: "Invalid move" });
			return;
		}

		const metaStr = await this.redis.get(`pvp:${matchId}:meta`);
		const playerStr = await this.redis.get(
			`pvp:${matchId}:player:${userId}`,
		);
		if (!metaStr || !playerStr) return;

		const meta = JSON.parse(metaStr) as MatchState;
		if (meta.terminal)
			return this.endMatch(
				matchId,
				meta.terminal.triggerUserId,
				meta.terminal.reason,
			);
		if (meta.status !== "PLAYING" || !meta.players.includes(userId)) return;
		const player = JSON.parse(playerStr) as PlayerState;
		const { row, col, value } = payload;
		const cell = player.board[row][col];

		if (cell.readonly) return;

		if (value === null) {
			cell.value = null;
			cell.invalid = false;
		} else {
			const isCorrect = meta.solution[row][col] === value;
			cell.value = value;
			cell.invalid = !isCorrect;
			if (!isCorrect) {
				player.errors++;
			} else {
				cell.readonly = true;
			}
		}

		await this.redis.setex(
			`pvp:${matchId}:player:${userId}`,
			3600,
			JSON.stringify(player),
		);
		if (player.errors >= 3)
			return this.endMatch(matchId, userId, "DISQUALIFIED");
		if (isBoardComplete(player.board, meta.solution))
			return this.endMatch(matchId, userId, "WINNER");

		client.emit("pvp_move_result", {
			board: player.board,
			errors: player.errors,
		});
		const progress = this.calculateProgress(
			player.board,
			meta.initialEmptyCells ?? 51,
		);
		client.to(matchId).emit("opponent_update", {
			userId,
			progress,
			errors: player.errors,
		});
	}

	private async endMatch(
		matchId: string,
		triggerUserId: string,
		reason: "WINNER" | "DISQUALIFIED",
	) {
		const raw = await this.redis.get(`pvp:${matchId}:meta`);
		if (!raw) return;
		const meta = JSON.parse(raw) as MatchState;
		if (meta.terminal) {
			triggerUserId = meta.terminal.triggerUserId;
			reason = meta.terminal.reason;
		} else {
			meta.terminal = { triggerUserId, reason };
			await this.redis.setex(
				`pvp:${matchId}:meta`,
				3600,
				JSON.stringify(meta),
			);
		}
		const winnerId =
			reason === "WINNER"
				? triggerUserId
				: meta.players.find(id => id !== triggerUserId)!;
		const startedAt = new Date(meta.startedAt ?? new Date().toISOString());
		const timeElapsed = Math.max(
			0,
			Math.floor((Date.now() - startedAt.getTime()) / 1000),
		);
		const states = await Promise.all(
			meta.players.map(async userId => {
				const raw = await this.redis.get(
					`pvp:${matchId}:player:${userId}`,
				);
				if (!raw) throw new Error("Missing player state");
				return { userId, state: JSON.parse(raw) as PlayerState };
			}),
		);
		const result = await this.games.finalize({
			id: matchId,
			gameKey: "sudoku",
			modeKey: "pvp",
			difficulty: "medium",
			reason,
			startedAt,
			durationSeconds: timeElapsed,
			participants: states.map(({ userId, state }) => ({
				userId,
				outcome: userId === winnerId ? "WIN" : "LOSS",
				errors: state.errors,
				timeElapsed,
			})),
		});
		this.server.to(matchId).emit("match_end", {
			winnerId: result.participants.find(p => p.outcome === "WIN")
				?.userId,
			reason: result.reason,
			participants: result.participants.map(p => ({
				userId: p.userId,
				xpGained: p.xpGained,
				newTotalXp: p.newTotalXp,
			})),
		});
		await this.redis.del(`pvp:${matchId}:meta`);
		for (const pid of meta.players) {
			await this.redis.del(`pvp:${matchId}:player:${pid}`);
			await this.redis.del(`pvp:player:${pid}:active_match`);
		}
	}

	private calculateProgress(
		board: SudokuBoard,
		initialEmptyCells: number,
	): number {
		const remaining = board
			.flat()
			.filter(cell => !cell.readonly || cell.invalid).length;
		return initialEmptyCells === 0
			? 100
			: Math.max(
					0,
					Math.min(
						100,
						Math.round(
							((initialEmptyCells - remaining) /
								initialEmptyCells) *
								100,
						),
					),
				);
	}
}
