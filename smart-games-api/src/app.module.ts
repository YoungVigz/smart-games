import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SudokuModule } from './sudoku/sudoku.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RankingModule } from './ranking/ranking.module';
import { PvpModule } from './pvp/pvp.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		EventEmitterModule.forRoot(), 
		AuthModule, 
		SudokuModule, 
		RedisModule, RankingModule, PvpModule
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
