import { Controller, Get, Param, Patch, Body, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { RankingService, LeaderboardType } from '../ranking/ranking.service';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
    constructor(
        private prisma: PrismaService,
        private ranking: RankingService
    ) {}

    @Get('profile/:login')
    async getProfile(@Param('login') login: string) {
        const user = await this.prisma.user.findUnique({
            where: { login },
            select: {
                id: true,
                login: true,
                xp: true,
                bio: true,
                avatar: true,
                createdAt: true,
                _count: { select: { games: true } }
            }
        });

        if (!user) throw new NotFoundException('Użytkownik nie istnieje');

        const globalRank = await this.ranking.getUserRank(LeaderboardType.XP, user.id);

        return {
            ...user,
            rank: globalRank || 'N/A'
        };
    }

    @Patch('profile')
    async updateProfile(@Req() req, @Body() data: { bio?: string, avatar?: string }) {
        return this.prisma.user.update({
            where: { id: req.user.sub },
            data: {
                bio: data.bio,
                avatar: data.avatar
            }
        });
    }
}
