import {
	Body,
	Controller,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, SignInDto } from './dto/auth.dto';
import type { Request, Response } from 'express';

/**
 * TODO:
 * - Change password
 * - Password forgot
 */

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	maxAge: 7 * 24 * 60 * 60 * 1000,
	path: '/',
};

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('/register')
	async register(
		@Body() dto: RegisterDto,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		await this.authService.register(dto);
		const { accessToken, refreshToken } = await this.authService.signIn(dto, req);

		res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);
		return { accessToken };
	}

	@Post('/login')
	async signIn(
		@Body() dto: SignInDto,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		const { accessToken, refreshToken, user } = await this.authService.signIn(dto, req);

		res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);
		return { accessToken, user };
	}

	@Post('/logout')
	async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

		if (rawRefreshToken) await this.authService.logout(rawRefreshToken);

		res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
		return { message: 'Logged out successfully' };
	}

	@Post('/logout-all')
	async logoutAll(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
		if (!rawRefreshToken) throw new UnauthorizedException('Missing refresh token');

		await this.authService.logoutAll(rawRefreshToken);

		res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
		return { message: 'Logged out from all devices' };
	}

	@Post('/refresh')
	async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
		if (!rawRefreshToken) throw new UnauthorizedException('Missing refresh token');

		const { accessToken, refreshToken, user } = await this.authService.refresh(rawRefreshToken, req);

		res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);
		return { accessToken, user };
	}
}
