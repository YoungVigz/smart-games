import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from 'prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
	hash: jest.fn(),
	compare: jest.fn(),
}));

describe('AuthService', () => {
	let service: AuthService;

	const prismaMock = {
		user: {
			findFirst: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
		},
		userSession: {
			create: jest.fn(),
			findUnique: jest.fn(),
			update: jest.fn(),
			updateMany: jest.fn(),
		},
		$transaction: jest.fn(),
	};

	const mockReq = {
		ip: '127.0.0.1',
		headers: { 'user-agent': 'jest-test' },
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: PrismaService, useValue: prismaMock },
				{
					provide: JwtService,
					useValue: { sign: jest.fn().mockReturnValue('mocked-jwt') },
				},
				{
					provide: ConfigService,
					useValue: { get: jest.fn().mockReturnValue('secret') },
				},
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		jest.clearAllMocks();
	});

	describe('register', () => {
		it('should throw BadRequestException if user with same login exists', async () => {
			prismaMock.user.findFirst.mockResolvedValue({
				login: 'test1',
				email: 'other@test.com',
			});

			await expect(
				service.register({
					login: 'test1',
					email: 'new@test.com',
					password: 'pass',
				}),
			).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException if user with same email exists', async () => {
			prismaMock.user.findFirst.mockResolvedValue({
				login: 'other',
				email: 'test@test.com',
			});

			await expect(
				service.register({
					login: 'newlogin',
					email: 'test@test.com',
					password: 'pass',
				}),
			).rejects.toThrow(BadRequestException);
		});

		it('should throw InternalServerErrorException if hashing fails', async () => {
			prismaMock.user.findFirst.mockResolvedValue(null);
			(bcrypt.hash as jest.Mock).mockRejectedValue(new Error('hash failed'));

			await expect(
				service.register({
					login: 'test1',
					email: 'test@test.com',
					password: 'pass',
				}),
			).rejects.toThrow();
		});

		it('should create user successfully', async () => {
			prismaMock.user.findFirst.mockResolvedValue(null);
			(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
			prismaMock.user.create.mockResolvedValue({
				id: 'uuid',
				login: 'test1',
				email: 'test@test.com',
			});

			const result = await service.register({
				login: 'test1',
				email: 'test@test.com',
				password: 'plain',
			});

			expect(bcrypt.hash).toHaveBeenCalledWith('plain', 12);
			expect(prismaMock.user.create).toHaveBeenCalled();
			expect(result).toEqual({
				id: 'uuid',
				login: 'test1',
				email: 'test@test.com',
			});
		});
	});

	describe('signIn', () => {
		it('should throw BadRequestException if user not found', async () => {
			prismaMock.user.findFirst.mockResolvedValue(null);

			await expect(
				service.signIn({ email: 'noone@test.com', password: 'pass' }, mockReq as any),
			).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException if password is invalid', async () => {
			prismaMock.user.findFirst.mockResolvedValue({
				id: '1',
				login: 'user',
				password: 'hashed',
			});
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			await expect(
				service.signIn({ email: 'user@test.com', password: 'wrong' }, mockReq as any),
			).rejects.toThrow(BadRequestException);
		});

		it('should return tokens on valid credentials', async () => {
			prismaMock.user.findFirst.mockResolvedValue({
				id: '1',
				login: 'user',
				password: 'hashed',
			});
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			prismaMock.userSession.create.mockResolvedValue({});

			const result = await service.signIn(
				{ email: 'user@test.com', password: 'correct' },
				mockReq as any,
			);

			expect(result).toHaveProperty('accessToken');
			expect(result).toHaveProperty('refreshToken');
		});
	});

	describe('refresh', () => {
		it('should throw ForbiddenException if session not found', async () => {
			prismaMock.userSession.findUnique.mockResolvedValue(null);

			await expect(service.refresh('bad-token', mockReq as any)).rejects.toThrow(
				ForbiddenException,
			);
		});

		it('should throw ForbiddenException and revoke all sessions if token is already revoked', async () => {
			prismaMock.userSession.findUnique.mockResolvedValue({
				id: '1',
				userId: 'user1',
				revoked: true,
				expiresAt: new Date(Date.now() + 10000),
				user: { id: 'user1', login: 'user' },
			});

			await expect(service.refresh('stolen-token', mockReq as any)).rejects.toThrow(
				ForbiddenException,
			);

			expect(prismaMock.userSession.updateMany).toHaveBeenCalledWith({
				where: { userId: 'user1' },
				data: { revoked: true },
			});
		});
	});
});
