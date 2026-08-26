import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { CheckContentDto } from './dto/check-content.dto';
import { FirebaseAuthGuard } from '../common/guards/auth.guard';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Moderation')
@ApiBearerAuth('JWT-auth')
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('spaces')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async checkSpacesContent(@Body() dto: CheckContentDto) {
    return this.moderationService.checkContent(dto);
  }
}
