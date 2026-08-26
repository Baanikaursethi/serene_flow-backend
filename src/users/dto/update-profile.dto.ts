import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'The display name of the user', example: 'John Doe', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Display name must be at least 2 characters' })
  name?: string;

  @ApiPropertyOptional({ description: 'The avatar URL or base64 image data for the profile', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class UpdateAvatarDto {
  @ApiProperty({ description: 'The avatar URL or base64 image data', example: 'data:image/png;base64,iVBORw0KGgo...' })
  @IsString()
  avatar!: string;
}
