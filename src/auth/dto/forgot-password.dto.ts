import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'The email address of the user', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
