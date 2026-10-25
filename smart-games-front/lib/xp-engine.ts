export class XpEngine {
    static getLevel(totalXp: number): number {
        const xp = Number(totalXp) || 0;
        if (xp <= 0) return 1;
        return Math.floor(Math.pow(xp / 100, 1 / 1.8)) + 1;
    }

    static getTotalXpForLevel(level: number): number {
        if (level <= 1) return 0;
        return Math.round(100 * Math.pow(level - 1, 1.8));
    }

    static getLevelProgress(totalXp: number) {
        const currentLevel = this.getLevel(totalXp);
        const xpStart = this.getTotalXpForLevel(currentLevel);
        const xpEnd = this.getTotalXpForLevel(currentLevel + 1);
        
        const xpInLevel = totalXp - xpStart;
        const xpRequired = xpEnd - xpStart;
        
        return {
            level: currentLevel,
            progress: Math.min(99.9, (xpInLevel / xpRequired) * 100),
            xpInLevel,
            xpRequired
        };
    }
}