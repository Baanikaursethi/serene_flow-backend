import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMoodDto {
  @ApiProperty({ description: 'The mood rating from 1 (Very Bad) to 5 (Great)', example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ description: 'The main label of the mood', example: 'Calm' })
  @IsString()
  @IsNotEmpty()
  moodLabel!: string;

  @ApiPropertyOptional({ description: 'List of specific sub-emotions', example: ['peaceful', 'content'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emotions?: string[];

  @ApiPropertyOptional({ description: 'Additional user notes/reflection', example: 'Had a nice walk outside today.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Recommended exercise based on this mood rating', example: 'Deep breathing for 5 minutes' })
  @IsOptional()
  @IsString()
  recommendedExercise?: string;
}
