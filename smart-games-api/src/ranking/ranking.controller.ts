import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { RankingService, LeaderboardType } from './ranking.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('ranking')
@UseGuards(AuthGuard)
export class RankingController {
    
    constructor(
        private readonly rankingService: RankingService
    ) {}

    @Get('xp')
    getXpRanking(@Req() req) {
        return this.rankingService.getLeaderboard(LeaderboardType.XP, req.user.sub);
    }

    @Get('pvp')
    getPvpRanking() {
        return { leaderboard: [], isUpcoming: true };
    }
}