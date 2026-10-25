import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from 'prisma/prisma.service';

export enum LeaderboardType {
  XP = 'xp',
  PVP = 'pvp',
}

@Injectable()
export class RankingService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject('REDIS_CLIENT') private readonly redis: Redis
    ) {}

    private getRef(type: LeaderboardType) {
        return `leaderboard:${type}`;
    }

    async updateScore(type: LeaderboardType, userId: string, score: number) {
        await this.redis.zadd(this.getRef(type), score, userId);
    }

    async getTop(type: LeaderboardType, limit: number = 100) {
        return this.redis.zrevrange(this.getRef(type), 0, limit - 1, 'WITHSCORES');
    }

    async getUserRank(type: LeaderboardType, userId: string) {
        const rank = await this.redis.zrevrank(this.getRef(type), userId);
        return rank !== null ? rank + 1 : null;
    }

    async getLeaderboard(type: LeaderboardType, userId: string, limit: number = 100) {
        const topIdsWithScores = await this.redis.zrevrange(
            `leaderboard:${type}`, 
            0, 
            limit - 1, 
            'WITHSCORES'
        );

        const ids: string[] = [];
        const scoresMap = new Map<string, number>();

        for (let i = 0; i < topIdsWithScores.length; i += 2) {
            const id = topIdsWithScores[i];
            ids.push(id);
            scoresMap.set(id, parseInt(topIdsWithScores[i + 1]));
        }

        const users = await this.prisma.user.findMany({
            where: { id: { in: ids } },
            select: { id: true, login: true, xp: true, }
        });

        const leaderboard = ids.map((id, index) => {
            const user = users.find(u => u.id === id);
            return {
                rank: index + 1,
                userId: id,
                login: user?.login || 'Nieznany',
                score: scoresMap.get(id)
            };
        });

        const myRankIndex = await this.redis.zrevrank(`leaderboard:${type}`, userId);
        const myScore = await this.redis.zscore(`leaderboard:${type}`, userId);

        return {
            leaderboard,
            myStats: {
                rank: myRankIndex !== null ? myRankIndex + 1 : 'N/A',
                score: myScore ? parseInt(myScore) : 0,
                isInTop: myRankIndex !== null && myRankIndex < limit
            }
        };
    }
}
