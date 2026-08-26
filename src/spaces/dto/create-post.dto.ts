import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: 'The text content of the post', example: 'Feeling great today!' })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiPropertyOptional({ description: 'Whether the post should be published anonymously', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;
}
