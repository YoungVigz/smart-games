import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { RegisterDto } from '../dto/auth.dto';

describe('AuthController', () => {
	let authController: AuthController;

	const mockAuthService = {
		register: jest.fn(),
		signIn: jest.fn(),
		logout: jest.fn(),
		logoutAll: jest.fn(),
		refresh: jest.fn(),
		changePassword: jest.fn(),
	};

	const mockRes = {
		cookie: jest.fn(),
		clearCookie: jest.fn(),
	};

	const mockReq = {
		cookies: {},
		ip: '127.0.0.1',
		headers: { 'user-agent': 'jest' },
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [{ provide: AuthService, useValue: mockAuthService }],
		}).compile();

		authController = module.get<AuthController>(AuthController);
		jest.clearAllMocks();
	});

	describe('register', () => {
		it('should throw BadRequestException if DTO is invalid', async () => {
			const pipe = new ValidationPipe({ whitelist: true });
			const invalidDto: RegisterDto = {
				login: 'u',
				email: 'not-an-email',
				password: '123',
			};

			await expect(
				pipe.transform(invalidDto, { type: 'body', metatype: RegisterDto }),
			).rejects.toThrow(BadRequestException);
		});

		it('should register, set cookie and return accessToken', async () => {
			const dto = { login: 'user', email: 'a@a.com', password: 'Password1!' };
			mockAuthService.register.mockResolvedValue(undefined);
			mockAuthService.signIn.mockResolvedValue({
				accessToken: 'access-token',
				refreshToken: 'refresh-token',
			});

			const result = await authController.register(
				dto as RegisterDto,
				mockReq as any,
				mockRes as any,
			);

			expect(mockAuthService.register).toHaveBeenCalledWith(dto);
			expect(mockAuthService.signIn).toHaveBeenCalledWith(dto, mockReq);
			expect(mockRes.cookie).toHaveBeenCalledWith(
				'refresh_token',
				'refresh-token',
				expect.any(Object),
			);
			expect(result).toEqual({ accessToken: 'access-token' });
		});
	});

	describe('logout', () => {
		it('should logout and clear cookie', async () => {
			mockReq.cookies = { refresh_token: 'some-token' };
			mockAuthService.logout.mockResolvedValue(undefined);

			const result = await authController.logout(mockReq as any, mockRes as any);

			expect(mockAuthService.logout).toHaveBeenCalledWith('some-token');
			expect(mockRes.clearCookie).toHaveBeenCalled();
			expect(result).toEqual({ message: 'Logged out successfully' });
		});

		it('should clear cookie even without refresh token in request', async () => {
			mockReq.cookies = {};

			const result = await authController.logout(mockReq as any, mockRes as any);

			expect(mockAuthService.logout).not.toHaveBeenCalled();
			expect(mockRes.clearCookie).toHaveBeenCalled();
			expect(result).toEqual({ message: 'Logged out successfully' });
		});
	});
});
