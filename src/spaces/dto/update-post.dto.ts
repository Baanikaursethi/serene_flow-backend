import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiProperty({ description: 'The updated text content of the post', example: 'Updated feeling great today!' })
  @IsString()
  @IsNotEmpty()
  text!: string;
}
