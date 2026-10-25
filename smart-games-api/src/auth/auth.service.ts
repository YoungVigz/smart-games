import {
	BadRequestException,
	InternalServerErrorException,
	Injectable,
	ForbiddenException,
	UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { RegisterDto, SignInDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated/prisma/client';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Request } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwt: JwtService,
		private eventEmitter: EventEmitter2
	) {}

	async register(dto: RegisterDto): Promise<Partial<User>> {
		const existingUser = await this.prisma.user.findFirst({
			where: { OR: [{ email: dto.email }, { login: dto.login }] },
		});

		if (existingUser)
			throw new BadRequestException('An account with this email or login already exists');

		let hashPassword: string;
		try {
			hashPassword = await bcrypt.hash(dto.password, 12);
		} catch {
			throw new InternalServerErrorException(
				'We could not complete your registration at this time',
			);
		}

		const newUser = await this.prisma.user.create({
			data: {
				login: dto.login,
				email: dto.email,
				password: hashPassword,
			},
			select: { id: true, login: true, email: true },
		});

		this.eventEmitter.emit('user.xp_updated', {
			userId: newUser.id,
			newTotalXp: 0,
		});

		return newUser;
	}

	async signIn(
		dto: SignInDto,
		req: Request,
	) {
		const user = await this.prisma.user.findFirst({
			where: dto.email ? { email: dto.email } : { login: dto.login },
		});
		if (!user) throw new BadRequestException('Invalid credentials');

		const isPasswordValid = await bcrypt.compare(dto.password, user.password);
		if (!isPasswordValid) throw new BadRequestException('Invalid credentials');

		const tokens = await this.generateSessionTokens(user.id, user.login, req);
    
		return {
			...tokens,
			user: { id: user.id, login: user.login, xp: user.xp } 
		};
	}

	async refresh(rawRefreshToken: string, req: Request) {
		const tokenHash = this.hashToken(rawRefreshToken);
		
		const session = await this.prisma.userSession.findUnique({
			where: { tokenHash },
			include: { user: true },
		});

		if (!session || session.revoked || session.expiresAt < new Date()) {
			throw new UnauthorizedException('Sesja wygasła lub jest nieprawidłowa');
		}

		const newRawRefreshToken = crypto.randomBytes(64).toString('hex');
		const newTokenHash = this.hashToken(newRawRefreshToken);
		const newExpiresAt = new Date();
		newExpiresAt.setDate(newExpiresAt.getDate() + 7);

		await this.prisma.userSession.update({
			where: { id: session.id },
			data: {
				tokenHash: newTokenHash,
				expiresAt: newExpiresAt,
				ip: req.ip,
				userAgent: req.headers['user-agent'],
			},
		});

		const accessToken = this.jwt.sign({ sub: session.user.id, login: session.user.login });

		return { 
			accessToken, 
			refreshToken: newRawRefreshToken,
			user: {
				id: session.user.id,
				login: session.user.login,
				xp: session.user.xp
			}
		};
	}

	async logout(rawRefreshToken: string): Promise<void> {
		const tokenHash = this.hashToken(rawRefreshToken);
		await this.prisma.userSession.updateMany({
			where: { tokenHash },
			data: { revoked: true },
		});
	}

	async logoutAll(rawRefreshToken: string): Promise<void> {
		const tokenHash = this.hashToken(rawRefreshToken);
		const session = await this.prisma.userSession.findUnique({
			where: { tokenHash },
		});

		if (!session) throw new ForbiddenException('Invalid session');

		await this.prisma.userSession.updateMany({
			where: { userId: session.userId },
			data: { revoked: true },
		});
	}

	private async generateSessionTokens(
		userId: string,
		login: string,
		req: Request,
	): Promise<{ accessToken: string; refreshToken: string }> {
		const payload = { sub: userId, login };
		const accessToken = this.jwt.sign(payload);

		const rawRefreshToken = crypto.randomBytes(64).toString('hex');
		const tokenHash = this.hashToken(rawRefreshToken);

		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		await this.prisma.userSession.create({
			data: {
				userId,
				tokenHash,
				expiresAt,
				ip: req.ip,
				userAgent: req.headers['user-agent'],
			},
		});

		await this.prisma.userSession.deleteMany({
			where: {
				userId,
				OR: [
					{ revoked: true },
					{ expiresAt: { lt: new Date() } }
				]
			}
		});

		return { accessToken, refreshToken: rawRefreshToken };
	}

	private hashToken(token: string): string {
		return crypto.createHash('sha256').update(token).digest('hex');
	}
}
