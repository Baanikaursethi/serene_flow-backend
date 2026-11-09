import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: 'The text content of the post', example: 'Feeling great today!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Post text must be 2000 characters or fewer.' })
  text!: string;

  @ApiPropertyOptional({ description: 'Whether the post should be published anonymously', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;
}
