import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'The email address of the user', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'The verification code received via email', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ description: 'The email address of the user', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
