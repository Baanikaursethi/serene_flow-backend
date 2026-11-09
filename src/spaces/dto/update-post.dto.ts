import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiProperty({ description: 'The updated text content of the post', example: 'Updated feeling great today!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Post text must be 2000 characters or fewer.' })
  text!: string;
}
