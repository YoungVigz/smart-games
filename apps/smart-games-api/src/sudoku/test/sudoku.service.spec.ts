import { SudokuService } from "../sudoku.service";
import {
	generateFullBoard,
	createBoard,
} from "@smart-games/game-engine/sudoku";
import type { SudokuGameView, MatrixBoard } from "@smart-games/game-engine";
import type { PrismaService } from "../../../prisma/prisma.service";
import type { GamesService } from "../../games/games.service";
import type Redis from "ioredis";

describe("Sudoku settlement", () => {
	let state: SudokuGameView & { solution: MatrixBoard };
	let redis: {
		get: jest.Mock;
		set: jest.Mock;
		setex: jest.Mock;
		del: jest.Mock;
		eval: jest.Mock;
	};
	let finalize: jest.Mock;
	let service: SudokuService;
	beforeEach(() => {
		const solution = generateFullBoard();
		const board = createBoard(solution);
		board[0][0] = { value: null, readonly: false, notes: [] };
		state = {
			id: "solo-test",
			userId: "player",
			gameKey: "sudoku",
			modeKey: "solo",
			difficulty: "HARD",
			status: "IN_PROGRESS",
			board,
			solution,
			errors: 2,
			timeElapsed: 10,
			startedAt: new Date().toISOString(),
			lastStartedAt: null,
		};
		redis = {
			get: jest.fn(async () => JSON.stringify(state)),
			set: jest.fn().mockResolvedValue("OK"),
			setex: jest.fn().mockResolvedValue("OK"),
			del: jest.fn().mockResolvedValue(1),
			eval: jest.fn().mockResolvedValue(1),
		};
		finalize = jest
			.fn()
			.mockResolvedValue({
				participants: [{ xpGained: 400, newTotalXp: 900 }],
			});
		service = new SudokuService(
			{} as PrismaService,
			{ finalize } as unknown as GamesService,
			redis as unknown as Redis,
		);
	});
	it("returns the public board without exposing its solution", async () => {
		const view = await service.getActiveGame("player");
		expect(view?.board).toEqual(state.board);
		expect(view).not.toHaveProperty("solution");
	});
	it("settles a server-validated win with stored mode, difficulty and errors", async () => {
		const result = await service.makeMove(
			"player",
			0,
			0,
			state.solution[0][0],
		);
		expect(finalize).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "solo-test",
				gameKey: "sudoku",
				modeKey: "solo",
				difficulty: "hard",
				participants: [
					{
						userId: "player",
						outcome: "WIN",
						errors: 2,
						timeElapsed: 10,
					},
				],
			}),
		);
		expect(result).toMatchObject({
			status: "COMPLETED",
			xpGained: 400,
			newTotalXp: 900,
		});
		expect(result).not.toHaveProperty("solution");
		expect(redis.del).toHaveBeenCalledWith("sudoku:active:player");
	});
	it("retains the active board when settlement fails so the move can be retried", async () => {
		finalize.mockRejectedValueOnce(new Error("Database unavailable"));
		await expect(
			service.makeMove("player", 0, 0, state.solution[0][0]),
		).rejects.toThrow("Database unavailable");
		expect(redis.del).not.toHaveBeenCalled();
		await expect(
			service.makeMove("player", 0, 0, state.solution[0][0]),
		).resolves.toMatchObject({ status: "COMPLETED" });
	});
	it("rejects malformed moves and records surrender without a win", async () => {
		await expect(service.makeMove("player", -1, 0, 1)).rejects.toThrow(
			"Invalid move",
		);
		expect(finalize).not.toHaveBeenCalled();
		await service.surrender("player");
		expect(finalize).toHaveBeenCalledWith(
			expect.objectContaining({
				participants: [
					{
						userId: "player",
						outcome: "SURRENDER",
						errors: 2,
						timeElapsed: 10,
					},
				],
			}),
		);
	});
});
