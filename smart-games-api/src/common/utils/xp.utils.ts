export const XP_CONFIG = {
  BASE_XP: {
    EASY: 100,
    MEDIUM: 250,
    HARD: 500,
  },
  MIN_MULTIPLIER: 0.3, 
  ERROR_PENALTY: 0.10,
};

export class XpEngine {
  static getLevel(totalXp: number): number {
    if (totalXp <= 0) return 1;
    return Math.floor(Math.pow(totalXp / 100, 1 / 1.8)) + 1;
  }

  static getTotalXpForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.round(100 * Math.pow(level - 1, 1.8));
  }

  static calculateGameReward(difficulty: string, errors: number): number {
    const base = XP_CONFIG.BASE_XP[difficulty as keyof typeof XP_CONFIG.BASE_XP] || 100;
    const penalty = errors * XP_CONFIG.ERROR_PENALTY;
    const multiplier = Math.max(XP_CONFIG.MIN_MULTIPLIER, 1 - penalty);
    return Math.round(base * multiplier);
  }
}