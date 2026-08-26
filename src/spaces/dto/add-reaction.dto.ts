import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddReactionDto {
  @ApiProperty({ description: 'The type of reaction', example: 'heart', enum: ['heart', 'support', 'hug', 'star'] })
  @IsString()
  @IsNotEmpty()
  reactionType!: string;
}
