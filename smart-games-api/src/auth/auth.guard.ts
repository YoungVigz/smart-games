import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private config: ConfigService,
		private prisma: PrismaService, 
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);
		if (!token) throw new UnauthorizedException('Missing or invalid authorization header');

		try {
			const payload = await this.jwtService.verifyAsync(token, {
				secret: this.config.get<string>('JWT_ACCESS_SECRET'),
			});

			const user = await this.prisma.user.findUnique({ 
				where: { id: payload.sub },
				select: { id: true } 
			});

			if (!user) {
				throw new UnauthorizedException('User does not exist');
			}

			request['user'] = payload;
		} catch (error) {
			throw new UnauthorizedException('Invalid or expired token');
		}

		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
