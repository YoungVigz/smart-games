import { withRedisLock } from "../common/utils/redis-lock";
import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { Difficulty } from "./domain/types";
import { generateFullBoard } from "./engine/generator";
import { createPuzzle } from "./engine/puzzle";
import { PrismaService } from "prisma/prisma.service";
import { randomUUID, createHash } from "node:crypto";
import {
	parseDifficulty,
	type SudokuGameView,
	type MatrixBoard,
} from "@smart-games/game-engine";
import {
	createBoard,
	isBoardComplete,
	assertMove,
} from "@smart-games/game-engine/sudoku";
import { GamesService } from "../games/games.service";
import Redis from "ioredis";
type StoredGame = SudokuGameView & { solution: MatrixBoard };

@Injectable()
export class SudokuService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly games: GamesService,
		@Inject("REDIS_CLIENT") private readonly redis: Redis,
	) {}

	private view(game: StoredGame): SudokuGameView {
		const view = { ...game };
		Reflect.deleteProperty(view, "solution");
		return view;
	}
	async getActiveGame(userId: string) {
		const game = await this.getStoredGame(userId);
		return game ? this.view(game) : null;
	}
	private validateMove(row: number, col: number, value?: number) {
		try {
			assertMove(row, col, value);
		} catch {
			throw new BadRequestException("Invalid move");
		}
	}
	private async locked<T>(
		userId: string,
		action: () => Promise<T>,
	): Promise<T> {
		return withRedisLock(this.redis, "sudoku:lock:" + userId, action);
	}
	generateBoard(userId: string, difficulty: Difficulty) {
		return this.locked(userId, () =>
			this.generateBoardUnlocked(userId, difficulty),
		);
	}
	makeMove(userId: string, row: number, col: number, value: number) {
		return this.locked(userId, () =>
			this.makeMoveUnlocked(userId, row, col, value),
		);
	}
	togglePause(userId: string) {
		return this.locked(userId, () => this.togglePauseUnlocked(userId));
	}
	updateNote(userId: string, row: number, col: number, value: number) {
		return this.locked(userId, () =>
			this.updateNoteUnlocked(userId, row, col, value),
		);
	}
	erase(userId: string, row: number, col: number) {
		return this.locked(userId, () => this.eraseUnlocked(userId, row, col));
	}
	surrender(userId: string) {
		return this.locked(userId, () => this.surrenderUnlocked(userId));
	}

	private getGameKey(userId: string) {
		return `sudoku:active:${userId}`;
	}

	private async getStoredGame(userId: string): Promise<StoredGame | null> {
		const data = await this.redis.get(this.getGameKey(userId));
		if (!data) return null;
		const game = JSON.parse(data) as StoredGame;
		// Stable identity for games already in Redis before this release.
		game.id ??=
			"legacy-sudoku:" +
			userId +
			":" +
			createHash("sha256")
				.update(JSON.stringify(game.solution))
				.digest("hex");
		game.gameKey = "sudoku";
		game.modeKey = "solo";
		game.startedAt ??= game.lastStartedAt ?? new Date().toISOString();
		return game;
	}

	private async generateBoardUnlocked(
		userId: string,
		difficulty: Difficulty,
	) {
		try {
			difficulty = parseDifficulty(difficulty);
		} catch {
			throw new BadRequestException("Invalid difficulty");
		}
		const active = await this.getStoredGame(userId);
		if (active) throw new BadRequestException("Masz już aktywną grę!");

		const fullBoard = generateFullBoard();
		const puzzle = createPuzzle(fullBoard, difficulty);

		const boardState = createBoard(puzzle);

		const gameData: StoredGame = {
			id: randomUUID(),
			gameKey: "sudoku",
			modeKey: "solo",
			startedAt: new Date().toISOString(),
			userId,
			difficulty: difficulty.toUpperCase() as Uppercase<Difficulty>,
			board: boardState,
			solution: fullBoard,
			status: "IN_PROGRESS",
			errors: 0,
			timeElapsed: 0,
			lastStartedAt: new Date().toISOString(),
		};

		await this.redis.setex(
			this.getGameKey(userId),
			86400,
			JSON.stringify(gameData),
		);
		return this.view(gameData);
	}

	async preparePvpGame(difficulty: Difficulty) {
		const fullBoard = generateFullBoard();
		const puzzle = createPuzzle(fullBoard, difficulty);

		const boardState = createBoard(puzzle);

		return {
			board: boardState,
			solution: fullBoard,
		};
	}

	private async makeMoveUnlocked(
		userId: string,
		row: number,
		col: number,
		value: number,
	) {
		this.validateMove(row, col, value);
		const game = await this.getStoredGame(userId);
		if (!game || game.status !== "IN_PROGRESS")
			throw new BadRequestException(
				"Gra jest wstrzymana lub nie istnieje",
			);

		const count = game.board
			.flat()
			.filter(c => c.value === value && !c.invalid).length;
		if (count >= 9)
			throw new BadRequestException(`Cyfra ${value} jest już ułożona!`);

		const cell = game.board[row][col];
		if (cell.readonly) return this.view(game);

		const isCorrect = value === game.solution[row][col];
		cell.value = value;
		cell.invalid = !isCorrect;
		cell.notes = [];

		if (!isCorrect) {
			game.errors++;
		} else {
			cell.readonly = true;
			this.clearConflictNotes(game.board, row, col, value);

			if (isBoardComplete(game.board, game.solution)) {
				const finalTime = this.calculateTotalTime(game);

				const result = await this.games.finalize({
					id: game.id,
					gameKey: "sudoku",
					modeKey: "solo",
					difficulty: parseDifficulty(game.difficulty),
					reason: "SOLVED",
					startedAt: new Date(game.startedAt),
					durationSeconds: finalTime,
					participants: [
						{
							userId,
							outcome: "WIN",
							errors: game.errors,
							timeElapsed: finalTime,
						},
					],
				});
				const reward = result.participants[0];

				await this.redis.del(this.getGameKey(userId));
				return {
					...this.view(game),
					status: "COMPLETED",
					timeElapsed: finalTime,
					xpGained: reward.xpGained,
					newTotalXp: reward.newTotalXp,
				};
			}
		}

		await this.redis.setex(
			this.getGameKey(userId),
			86400,
			JSON.stringify(game),
		);
		return this.view(game);
	}

	private async togglePauseUnlocked(userId: string) {
		const game = await this.getStoredGame(userId);
		if (!game) throw new NotFoundException("Gra nie istnieje");

		if (game.status === "IN_PROGRESS") {
			game.timeElapsed = this.calculateTotalTime(game);
			game.lastStartedAt = null;
			game.status = "PAUSED";
		} else {
			game.lastStartedAt = new Date().toISOString();
			game.status = "IN_PROGRESS";
		}

		await this.redis.setex(
			this.getGameKey(userId),
			86400,
			JSON.stringify(game),
		);
		return this.view(game);
	}

	private async updateNoteUnlocked(
		userId: string,
		row: number,
		col: number,
		value: number,
	) {
		this.validateMove(row, col, value);
		const game = await this.getStoredGame(userId);
		if (!game) throw new NotFoundException("Gra nie istnieje");

		const board = game.board;
		const cell = board[row][col];
		if (cell.readonly || cell.value !== null) return this.view(game);

		if (!cell.notes) cell.notes = [];
		cell.notes = cell.notes.includes(value)
			? cell.notes.filter(n => n !== value)
			: [...cell.notes, value].sort((a, b) => a - b);

		await this.redis.setex(
			this.getGameKey(userId),
			86400,
			JSON.stringify(game),
		);
		return this.view(game);
	}

	private async eraseUnlocked(userId: string, row: number, col: number) {
		this.validateMove(row, col);
		const game = await this.getStoredGame(userId);
		if (!game) throw new NotFoundException("Gra nie istnieje");

		const board = game.board;
		if (!board[row][col].readonly) {
			board[row][col].value = null;
			board[row][col].invalid = false;
			board[row][col].notes = [];
		}

		await this.redis.setex(
			this.getGameKey(userId),
			86400,
			JSON.stringify(game),
		);
		return this.view(game);
	}

	private async surrenderUnlocked(userId: string) {
		const game = await this.getStoredGame(userId);
		if (!game) return;

		const timeElapsed = this.calculateTotalTime(game);
		await this.games.finalize({
			id: game.id,
			gameKey: "sudoku",
			modeKey: "solo",
			difficulty: parseDifficulty(game.difficulty),
			reason: "SURRENDERED",
			startedAt: new Date(game.startedAt),
			durationSeconds: timeElapsed,
			participants: [
				{
					userId,
					outcome: "SURRENDER",
					errors: game.errors,
					timeElapsed,
				},
			],
		});

		await this.redis.del(this.getGameKey(userId));
	}

	async getUserStats(userId: string) {
		const games = await this.prisma.sudokuGame.findMany({
			where: {
				userId,
				status: {
					in: ["COMPLETED", "SURRENDERED"],
				},
			},
			select: {
				difficulty: true,
				status: true,
				errors: true,
				timeElapsed: true,
				createdAt: true,
			},
		});

		return games;
	}

	private calculateTotalTime(game: StoredGame): number {
		if (!game.lastStartedAt) return game.timeElapsed;
		const now = new Date().getTime();
		const start = new Date(game.lastStartedAt).getTime();
		return game.timeElapsed + Math.floor((now - start) / 1000);
	}

	private clearConflictNotes(
		board: StoredGame["board"],
		row: number,
		col: number,
		value: number,
	) {
		for (let i = 0; i < 9; i++) {
			if (board[row][i].notes) {
				board[row][i].notes = board[row][i].notes!.filter(
					(n: number) => n !== value,
				);
			}
			if (board[i][col].notes) {
				board[i][col].notes = board[i][col].notes!.filter(
					(n: number) => n !== value,
				);
			}
		}

		const startRow = Math.floor(row / 3) * 3;
		const startCol = Math.floor(col / 3) * 3;
		for (let r = startRow; r < startRow + 3; r++) {
			for (let c = startCol; c < startCol + 3; c++) {
				if (board[r][c].notes) {
					board[r][c].notes = board[r][c].notes!.filter(
						(n: number) => n !== value,
					);
				}
			}
		}
	}
}
