import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Difficulty } from './domain/types';
import { generateFullBoard } from './engine/generator';
import { createPuzzle } from './engine/puzzle';
import { PrismaService } from 'prisma/prisma.service';
import { XpEngine } from 'src/common/utils/xp.utils';
import Redis from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SudokuService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly eventEmitter: EventEmitter2,
		@Inject('REDIS_CLIENT') private readonly redis: Redis,
	) {}

	private getGameKey(userId: string) {
		return `sudoku:active:${userId}`;
	}

	async getActiveGame(userId: string) {
		const data = await this.redis.get(this.getGameKey(userId));
		return data ? JSON.parse(data) : null;
	}

	async generateBoard(userId: string, difficulty: Difficulty) {
		const active = await this.getActiveGame(userId);
		if (active) throw new BadRequestException('Masz już aktywną grę!');

		const fullBoard = generateFullBoard();
		const puzzle = createPuzzle(fullBoard, difficulty);

		const boardState = puzzle.map(row =>
			row.map(value => ({
				value: value === 0 ? null : value,
				readonly: value !== 0,
				invalid: false,
				notes: [],
			})),
		);

		const gameData = {
			userId,
			difficulty: difficulty.toUpperCase(),
			board: boardState,
			solution: fullBoard,
			status: 'IN_PROGRESS',
			errors: 0,
			timeElapsed: 0,
			lastStartedAt: new Date(),
		};

		await this.redis.setex(this.getGameKey(userId), 86400, JSON.stringify(gameData));
		return gameData;
	}

	async preparePvpGame(difficulty: Difficulty) {
		const fullBoard = generateFullBoard();
		const puzzle = createPuzzle(fullBoard, difficulty);

		const boardState = puzzle.map(row =>
			row.map(value => ({
				value: value === 0 ? null : value,
				readonly: value !== 0,
				invalid: false,
				notes: [],
			})),
		);

		return {
			board: boardState,
			solution: fullBoard,
		};
	}


	async makeMove(userId: string, row: number, col: number, value: number) {
		const game = await this.getActiveGame(userId);
		if (!game || game.status !== 'IN_PROGRESS') 
			throw new BadRequestException('Gra jest wstrzymana lub nie istnieje');

		const count = game.board.flat().filter((c: any) => c.value === value && !c.invalid).length;
		if (count >= 9) throw new BadRequestException(`Cyfra ${value} jest już ułożona!`);

		const cell = game.board[row][col];
		if (cell.readonly) return game;

		const isCorrect = value === game.solution[row][col];
		cell.value = value;
		cell.invalid = !isCorrect;
		cell.notes = [];

		if (!isCorrect) {
			game.errors++;
		} else {
			cell.readonly = true;
			this.clearConflictNotes(game.board, row, col, value);

			if (this.isBoardComplete(game.board, game.solution)) {
				const finalTime = this.calculateTotalTime(game);
				
				const xpGained = XpEngine.calculateGameReward(game.difficulty, game.errors);
				const updatedUser = await this.prisma.user.update({
					where: { id: userId },
					data: { xp: { increment: xpGained } },
				});

				this.eventEmitter.emit('user.xp_updated', {
					userId: userId,
					newTotalXp: updatedUser.xp,
				});

				await this.prisma.sudokuGame.create({
					data: {
						userId,
						status: 'COMPLETED',
						difficulty: game.difficulty,
						errors: game.errors,
						timeElapsed: finalTime,
					}
				});

				await this.redis.del(this.getGameKey(userId));
				return { ...game, status: 'COMPLETED', timeElapsed: finalTime, xpGained, newTotalXp: updatedUser.xp };
			}
		}

		await this.redis.setex(this.getGameKey(userId), 86400, JSON.stringify(game));
		return game;
	}

	async togglePause(userId: string) {
		const game = await this.getActiveGame(userId);
		if (!game) throw new NotFoundException('Gra nie istnieje');

		if (game.status === 'IN_PROGRESS') {
			game.timeElapsed = this.calculateTotalTime(game);
			game.lastStartedAt = null;
			game.status = 'PAUSED';
		} else {
			game.lastStartedAt = new Date();
			game.status = 'IN_PROGRESS';
		}

		await this.redis.setex(this.getGameKey(userId), 86400, JSON.stringify(game));
		return game;
	}

	async updateNote(userId: string, row: number, col: number, value: number) {
		const game = await this.getActiveGame(userId);
		if (!game) throw new NotFoundException('Gra nie istnieje');

		const board = game.board as any;
		const cell = board[row][col];
		if (cell.readonly || cell.value !== null) return game;

		if (!cell.notes) cell.notes = [];
		cell.notes = cell.notes.includes(value)
			? cell.notes.filter(n => n !== value)
			: [...cell.notes, value].sort((a, b) => a - b);

		await this.redis.setex(this.getGameKey(userId), 86400, JSON.stringify(game));
		return game;
	}

	async erase(userId: string, row: number, col: number) {
		const game = await this.getActiveGame(userId);
		if (!game) throw new NotFoundException('Gra nie istnieje');
		
		const board = game.board as any;
		if (!board[row][col].readonly) {
			board[row][col].value = null;
			board[row][col].invalid = false;
			board[row][col].notes = []; 
		}

		await this.redis.setex(this.getGameKey(userId), 86400, JSON.stringify(game));
		return game;
	}

	async surrender(userId: string) {
		const game = await this.getActiveGame(userId);
		if (!game) return;

		await this.prisma.sudokuGame.create({
			data: {
				userId,
				status: 'SURRENDERED',
				difficulty: game.difficulty,
				errors: game.errors,
				timeElapsed: this.calculateTotalTime(game),
			}
		});

		await this.redis.del(this.getGameKey(userId));
	}

	async getUserStats(userId: string) {
		const games = await this.prisma.sudokuGame.findMany({
			where: {
				userId,
				status: {
					in: ["COMPLETED", "SURRENDERED"]
				}
			},
			select: {
				difficulty: true,
				status: true,
				errors: true,
				timeElapsed: true,
				createdAt: true
			}
		})

		return games
	}

	private calculateTotalTime(game: any): number {
		if (!game.lastStartedAt) return game.timeElapsed;
		const now = new Date().getTime();
		const start = new Date(game.lastStartedAt).getTime();
		return game.timeElapsed + Math.floor((now - start) / 1000);
	}

	private isBoardComplete(board: any[][], solution: number[][]): boolean {
		return board.every((r, ri) => r.every((c, ci) => c.value === solution[ri][ci]));
	}

	private clearConflictNotes(board: any[][], row: number, col: number, value: number) {
		for (let i = 0; i < 9; i++) {
			if (board[row][i].notes) {
				board[row][i].notes = board[row][i].notes.filter((n: number) => n !== value);
			}
			if (board[i][col].notes) {
				board[i][col].notes = board[i][col].notes.filter((n: number) => n !== value);
			}
		}

		const startRow = Math.floor(row / 3) * 3;
		const startCol = Math.floor(col / 3) * 3;
		for (let r = startRow; r < startRow + 3; r++) {
			for (let c = startCol; c < startCol + 3; c++) {
				if (board[r][c].notes) {
					board[r][c].notes = board[r][c].notes.filter((n: number) => n !== value);
				}
			}
		}
	}
}
