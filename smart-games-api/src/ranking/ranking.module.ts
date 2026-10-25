import { Module } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingListener } from './ranking.listener';
import { RankingController } from './ranking.controller';

@Module({
  controllers: [RankingController],
  providers: [RankingService, RankingListener],
  exports: [RankingService]
})
export class RankingModule {}
