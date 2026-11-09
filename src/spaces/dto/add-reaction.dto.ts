import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// These must match the REACTIONS array in the frontend SpacesPage.tsx exactly.
// The frontend sends the emoji character itself as the reactionType.
export const VALID_REACTIONS = ['❤️', '😊', '🌸', '💛', '🌈'] as const;

export class AddReactionDto {
  @ApiProperty({
    description: 'The reaction emoji to toggle',
    example: '❤️',
    enum: VALID_REACTIONS,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_REACTIONS, {
    message: `reactionType must be one of: ${VALID_REACTIONS.join(', ')}`,
  })
  reactionType!: string;
}
