import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RankingService, LeaderboardType } from './ranking.service';

@Injectable()
export class RankingListener {
    constructor(
        private readonly rankingService: RankingService
    ) {}

    @OnEvent('user.xp_updated')
    async handleXpUpdated(payload: { userId: string; newTotalXp: number }) {
        await this.rankingService.updateScore(
            LeaderboardType.XP, 
            payload.userId, 
            payload.newTotalXp
        );
    }
}