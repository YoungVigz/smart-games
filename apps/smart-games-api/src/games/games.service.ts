import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
	getGameMode,
	parseDifficulty,
	type GameOutcome,
	type Difficulty,
} from "@smart-games/game-engine";
import { calculateReward } from "@smart-games/xp";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "../../generated/prisma/client";

export interface FinalizeGame {
	id: string;
	gameKey: string;
	modeKey: string;
	difficulty: Difficulty;
	reason: string;
	startedAt: Date;
	durationSeconds: number;
	participants: {
		userId: string;
		outcome: GameOutcome;
		errors: number;
		timeElapsed: number;
	}[];
}
export interface GameFilters {
	gameKey?: string;
	modeKey?: string;
	difficulty?: string;
}

@Injectable()
export class GamesService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly events: EventEmitter2,
	) {}

	async finalize(input: FinalizeGame) {
		const mode = getGameMode(input.gameKey, input.modeKey);
		const participants = input.participants;
		if (
			participants.length < mode.minPlayers ||
			participants.length > mode.maxPlayers ||
			new Set(participants.map(p => p.userId)).size !==
				participants.length
		)
			throw new BadRequestException("Invalid participants");
		if (
			!Number.isSafeInteger(input.durationSeconds) ||
			input.durationSeconds < 0 ||
			!Number.isFinite(input.startedAt.getTime())
		)
			throw new BadRequestException("Invalid game time");
		for (const p of participants) {
			if (!Number.isSafeInteger(p.timeElapsed) || p.timeElapsed < 0)
				throw new BadRequestException("Invalid player time");
		}
		const rewards = participants.map(p => ({
			...p,
			...calculateReward({ ...input, ...p }),
		}));
		// The unique session ID gates the entire transaction, including XP increments.
		// Replays and concurrent terminal requests return the already committed result.
		let result: Prisma.GameSessionGetPayload<{
			include: { participants: true };
		}>;
		try {
			result = await this.prisma.$transaction(async tx => {
				const session = await tx.gameSession.create({
					data: {
						id: input.id,
						gameKey: input.gameKey,
						modeKey: input.modeKey,
						difficulty: input.difficulty,
						reason: input.reason,
						startedAt: input.startedAt,
						durationSeconds: input.durationSeconds,
						participants: {
							create: rewards.map(p => ({
								userId: p.userId,
								outcome: p.outcome,
								errors: p.errors,
								timeElapsed: p.timeElapsed,
								xpGained: p.xpGained,
								rewardVersion: p.policyVersion,
							})),
						},
					},
					include: { participants: true },
				});
				for (const p of rewards) {
					await tx.user.update({
						where: { id: p.userId },
						data: { xp: { increment: p.xpGained } },
					});
					// Retain the existing Sudoku statistics/profile contract during migration.
					if (
						input.gameKey === "sudoku" &&
						input.modeKey === "solo"
					) {
						await tx.sudokuGame.create({
							data: {
								id: input.id,
								userId: p.userId,
								difficulty:
									input.difficulty.toUpperCase() as Uppercase<Difficulty>,
								status:
									p.outcome === "WIN"
										? "COMPLETED"
										: "SURRENDERED",
								errors: p.errors,
								timeElapsed: p.timeElapsed,
							},
						});
					}
				}
				return session;
			});
		} catch (error) {
			if (
				!(error instanceof Prisma.PrismaClientKnownRequestError) ||
				error.code !== "P2002"
			)
				throw error;
			const existing = await this.prisma.gameSession.findUnique({
				where: { id: input.id },
				include: { participants: true },
			});
			if (
				!existing ||
				existing.gameKey !== input.gameKey ||
				existing.modeKey !== input.modeKey ||
				existing.participants.length !== participants.length ||
				existing.participants.some(
					p =>
						!participants.some(
							candidate => candidate.userId === p.userId,
						),
				)
			)
				throw error;
			result = existing;
		}
		const users = await this.prisma.user.findMany({
			where: { id: { in: participants.map(p => p.userId) } },
			select: { id: true, xp: true },
		});
		const settled = result.participants.map(p => ({
			...p,
			newTotalXp: users.find(user => user.id === p.userId)!.xp,
		}));
		for (const p of settled)
			this.events.emit("user.xp_updated", {
				userId: p.userId,
				newTotalXp: p.newTotalXp,
			});
		return { ...result, participants: settled };
	}

	private where(
		userId: string,
		filters: GameFilters,
	): Prisma.GameParticipantWhereInput {
		let difficulty: Difficulty | undefined;
		try {
			if (filters.difficulty)
				difficulty = parseDifficulty(filters.difficulty);
		} catch {
			throw new BadRequestException("Invalid difficulty");
		}
		return {
			userId,
			session: {
				gameKey: filters.gameKey,
				modeKey: filters.modeKey,
				difficulty,
			},
		};
	}
	async history(
		userId: string,
		filters: GameFilters,
		limit = 25,
		before?: string,
	) {
		if (!Number.isInteger(limit) || limit < 1 || limit > 100)
			throw new BadRequestException("Limit must be between 1 and 100");
		return this.prisma.gameParticipant.findMany({
			where: this.where(userId, filters),
			include: {
				session: {
					include: {
						participants: {
							select: {
								userId: true,
								outcome: true,
								errors: true,
								timeElapsed: true,
								xpGained: true,
							},
						},
					},
				},
			},
			orderBy: [{ session: { finishedAt: "desc" } }, { id: "desc" }],
			take: limit,
			...(before
				? {
						cursor: {
							sessionId_userId: { sessionId: before, userId },
						},
						skip: 1,
					}
				: {}),
		});
	}
	async statistics(userId: string, filters: GameFilters) {
		const where = this.where(userId, filters);
		const groups = await this.prisma.gameParticipant.groupBy({
			by: ["outcome"],
			where,
			_count: { _all: true, xpGained: true },
			_sum: { timeElapsed: true, errors: true, xpGained: true },
			_avg: { timeElapsed: true, errors: true },
		});
		return {
			gamesPlayed: groups.reduce(
				(sum, group) => sum + group._count._all,
				0,
			),
			wins:
				groups.find(group => group.outcome === "WIN")?._count._all ?? 0,
			timeElapsed: groups.reduce(
				(sum, group) => sum + (group._sum.timeElapsed ?? 0),
				0,
			),
			errors: groups.reduce(
				(sum, group) => sum + (group._sum.errors ?? 0),
				0,
			),
			recordedXp: groups.reduce(
				(sum, group) => sum + (group._sum.xpGained ?? 0),
				0,
			),
			gamesWithRecordedXp: groups.reduce(
				(sum, group) => sum + group._count.xpGained,
				0,
			),
			byOutcome: groups,
		};
	}

	async details(userId: string, sessionId: string) {
		const session = await this.prisma.gameSession.findFirst({
			where: { id: sessionId, participants: { some: { userId } } },
			include: {
				participants: {
					include: {
						user: {
							select: { id: true, login: true, avatar: true },
						},
					},
				},
			},
		});
		if (!session) throw new NotFoundException("Game result not found");
		return session;
	}
}
