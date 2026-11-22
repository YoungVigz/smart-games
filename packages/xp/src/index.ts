import {
	parseDifficulty,
	type Difficulty,
	type GameOutcome,
} from "@smart-games/game-engine";

export interface RewardInput {
	gameKey: string;
	modeKey: string;
	difficulty: Difficulty;
	outcome: GameOutcome;
	errors: number;
}
export interface RewardPolicy {
	version: string;
	baseXp: Readonly<Record<Difficulty, number>>;
	outcomeMultiplier: Readonly<Record<GameOutcome, number>>;
	errorPenalty: number;
	minMultiplier: number;
}
const sudokuPolicy: RewardPolicy = {
	version: "sudoku-v1",
	baseXp: { easy: 100, medium: 250, hard: 500 },
	outcomeMultiplier: { WIN: 1, LOSS: 0, DRAW: 0, SURRENDER: 0 },
	errorPenalty: 0.1,
	minMultiplier: 0.3,
};
export const REWARD_POLICIES: Readonly<Record<string, RewardPolicy>> = {
	"sudoku/solo": sudokuPolicy,
	"sudoku/pvp": { ...sudokuPolicy, version: "sudoku-pvp-v1" },
};

export function calculateReward(input: RewardInput): {
	xpGained: number;
	policyVersion: string;
} {
	const policy = REWARD_POLICIES[`${input.gameKey}/${input.modeKey}`];
	if (!policy) throw new RangeError("Unsupported XP policy");
	const difficulty = parseDifficulty(input.difficulty);
	if (!Number.isSafeInteger(input.errors) || input.errors < 0)
		throw new RangeError("Invalid error count");
	const outcomeMultiplier = policy.outcomeMultiplier[input.outcome];
	if (outcomeMultiplier === undefined)
		throw new RangeError("Invalid outcome");
	const multiplier = Math.max(
		policy.minMultiplier,
		1 - input.errors * policy.errorPenalty,
	);
	return {
		xpGained: Math.round(
			policy.baseXp[difficulty] * multiplier * outcomeMultiplier,
		),
		policyVersion: policy.version,
	};
}

function normalizeXp(totalXp: number): number {
	return Number.isFinite(totalXp)
		? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(totalXp)))
		: 0;
}

export class XpEngine {
	static getTotalXpForLevel(level: number): number {
		if (!Number.isSafeInteger(level) || level < 1)
			throw new RangeError("Invalid level");
		return Math.round(100 * Math.pow(level - 1, 1.8));
	}
	static getLevel(totalXp: number): number {
		const xp = normalizeXp(totalXp);
		let level = Math.floor(Math.pow(xp / 100, 1 / 1.8)) + 1;
		// Rounded thresholds must agree with the level shown at their boundaries.
		while (level > 1 && xp < this.getTotalXpForLevel(level)) level--;
		while (xp >= this.getTotalXpForLevel(level + 1)) level++;
		return level;
	}
	static getLevelProgress(totalXp: number) {
		const xp = normalizeXp(totalXp);
		const level = this.getLevel(xp);
		const xpInLevel = xp - this.getTotalXpForLevel(level);
		const xpRequired =
			this.getTotalXpForLevel(level + 1) - this.getTotalXpForLevel(level);
		return {
			level,
			progress: (xpInLevel / xpRequired) * 100,
			xpInLevel,
			xpRequired,
		};
	}
	static calculateGameReward(difficulty: string, errors: number): number {
		return calculateReward({
			gameKey: "sudoku",
			modeKey: "solo",
			difficulty: parseDifficulty(difficulty),
			outcome: "WIN",
			errors,
		}).xpGained;
	}
}
