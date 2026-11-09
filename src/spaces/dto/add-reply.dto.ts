import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddReplyDto {
  @ApiProperty({ description: 'The text content of the reply', example: 'I agree with this!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Reply text must be 1000 characters or fewer.' })
  text!: string;

  @ApiPropertyOptional({ description: 'Whether the reply should be published anonymously', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;
}
