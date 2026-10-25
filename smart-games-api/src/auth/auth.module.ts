import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from 'prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersController } from './users.controller';
import { RankingModule } from 'src/ranking/ranking.module';

@Global()
@Module({
	imports: [
		RankingModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				global: true,
				secret: config.get<string>('JWT_ACCESS_SECRET'),
				signOptions: {
					expiresIn: '1m',
				},
			}),
		}),
	],
	controllers: [AuthController, UsersController],
	providers: [AuthService, PrismaService],
	exports: [AuthService, PrismaService, JwtModule],
})
export class AuthModule {}
