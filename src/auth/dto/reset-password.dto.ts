import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'The email address receiving the reset code', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'The 6-digit password reset code received via email', example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Reset code must be exactly 6 digits' })
  code!: string;

  @ApiProperty({ description: 'The new password for the user account (min 6 characters)', example: 'newsecretpassword', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  newPassword!: string;
}
