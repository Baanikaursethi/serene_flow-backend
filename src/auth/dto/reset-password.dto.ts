import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'The reset password token received via email', example: 'abc123token' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: 'The new password for the user account (min 6 characters)', example: 'newsecretpassword', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  newPassword!: string;
}
