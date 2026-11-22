import { PvpGateway } from "./pvp.gateway";
import {
	generateFullBoard,
	createBoard,
} from "@smart-games/game-engine/sudoku";
import type { SudokuService } from "../sudoku/sudoku.service";
import type { GamesService } from "../games/games.service";
import type Redis from "ioredis";
import type { Server, Socket } from "socket.io";

describe("PvP settlement", () => {
	const matchId = "match:test";
	let state: Map<string, string>;
	let gateway: PvpGateway;
	let finalize: jest.Mock;
	let solution: number[][];
	let emit: jest.Mock;
	const client = (userId = "one") =>
		({
			data: { userId },
			emit: jest.fn(),
			to: jest.fn(() => ({ emit: jest.fn() })),
		}) as unknown as Socket;
	beforeEach(() => {
		solution = generateFullBoard();
		const board = createBoard(solution);
		board[0][0] = { value: null, readonly: false };
		state = new Map([
			[
				`pvp:${matchId}:meta`,
				JSON.stringify({
					matchId,
					solution,
					players: ["one", "two"],
					status: "PLAYING",
					startedAt: new Date().toISOString(),
					initialEmptyCells: 1,
				}),
			],
		]);
		for (const userId of ["one", "two"]) {
			state.set(`pvp:player:${userId}:active_match`, matchId);
			state.set(
				`pvp:${matchId}:player:${userId}`,
				JSON.stringify({ board, errors: 0 }),
			);
		}
		const redis = {
			get: jest.fn(async (key: string) => state.get(key) ?? null),
			set: jest.fn().mockResolvedValue("OK"),
			setex: jest.fn(async (key: string, _ttl: number, value: string) => {
				state.set(key, value);
				return "OK";
			}),
			del: jest.fn(async (key: string) => Number(state.delete(key))),
			eval: jest.fn().mockResolvedValue(1),
		};
		finalize = jest.fn(async input => ({
			...input,
			participants: input.participants.map(p => ({
				...p,
				xpGained: p.outcome === "WIN" ? 250 : 0,
				newTotalXp: 250,
			})),
		}));
		gateway = new PvpGateway(
			redis as unknown as Redis,
			{} as SudokuService,
			{ finalize } as unknown as GamesService,
		);
		emit = jest.fn();
		gateway.server = { to: jest.fn(() => ({ emit })) } as unknown as Server;
	});
	it("records the third error and awards the opponent the win", async () => {
		const key = `pvp:${matchId}:player:one`;
		const player = JSON.parse(state.get(key)!);
		player.errors = 2;
		state.set(key, JSON.stringify(player));
		await gateway.handleMove(client(), {
			row: 0,
			col: 0,
			value: (solution[0][0] % 9) + 1,
		});
		expect(finalize).toHaveBeenCalledWith(
			expect.objectContaining({
				modeKey: "pvp",
				reason: "DISQUALIFIED",
				participants: expect.arrayContaining([
					expect.objectContaining({
						userId: "one",
						outcome: "LOSS",
						errors: 3,
					}),
					expect.objectContaining({ userId: "two", outcome: "WIN" }),
				]),
			}),
		);
		expect(emit).toHaveBeenCalledWith(
			"match_end",
			expect.objectContaining({ winnerId: "two" }),
		);
	});
	it("retries a failed terminal settlement without changing the decided winner", async () => {
		finalize.mockRejectedValueOnce(new Error("Database unavailable"));
		await expect(
			gateway.handleMove(client(), {
				row: 0,
				col: 0,
				value: solution[0][0],
			}),
		).rejects.toThrow("Database unavailable");
		expect(state.has(`pvp:${matchId}:meta`)).toBe(true);
		await gateway.handleMove(client("two"), {
			row: 0,
			col: 0,
			value: solution[0][0],
		});
		expect(emit).toHaveBeenCalledWith(
			"match_end",
			expect.objectContaining({ winnerId: "one" }),
		);
		expect(state.has(`pvp:${matchId}:meta`)).toBe(false);
	});
});
