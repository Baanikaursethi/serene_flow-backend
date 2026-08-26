import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJournalDto {
  @ApiProperty({ description: 'The title of the journal entry', example: 'Reflections on today' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'The text content of the journal entry', example: 'Today was productive...' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class UpdateJournalDto {
  @ApiPropertyOptional({ description: 'The updated title of the journal entry', example: 'Reflections on a great today' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'The updated text content of the journal entry', example: 'Today was highly productive...' })
  @IsOptional()
  @IsString()
  content?: string;
}
