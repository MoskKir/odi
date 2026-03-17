import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class TokenPayloadDto {
  @IsString()
  sub: string;

  @IsEmail()
  email: string;

  @IsString()
  role: string;
}

export class UpdatePreferencesDto {
  theme?: 'dark' | 'light';
  fontSize?: number;
  devMode?: boolean;
}
