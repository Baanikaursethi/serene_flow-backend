import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckContentDto {
  @ApiProperty({ description: 'The text content to check for toxicity/moderation', example: 'This is a friendly post.' })
  @IsString()
  @IsNotEmpty()
  text!: string;
}
