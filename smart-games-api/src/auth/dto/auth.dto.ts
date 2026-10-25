import { IsString, IsEmail, MinLength, MaxLength, Matches, ValidateIf } from 'class-validator';

export class RegisterDto {
	@IsString({ message: 'Login must be a string' })
	@MinLength(4, { message: 'Login must be at least 4 characters long' })
	@MaxLength(20, { message: 'Login must be no longer than 20 characters' })
	login: string;

	@IsEmail({}, { message: 'Invalid email address' })
	email: string;

	@IsString({ message: 'Password must be a string' })
	@MinLength(8, { message: 'Password must be at least 8 characters long' })
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#(){}[\]<>.,;:~+\-=]).+$/, {
		message:
			'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
	})
	password: string;
}

export class SignInDto {
	@ValidateIf((o: SignInDto) => !o.email)
	@IsString({ message: 'Login must be a string' })
	login?: string;

	@ValidateIf((o: SignInDto) => !o.login)
	@IsEmail({}, { message: 'Invalid email address' })
	email?: string;

	@IsString({ message: 'Password must be a string' })
	@MinLength(1, { message: 'Password cannot be empty' })
	password: string;
}
