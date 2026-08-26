import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MoodService } from './mood.service';
import { FirebaseAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateMoodDto } from './dto/create-mood.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Moods')
@ApiBearerAuth('JWT-auth')
@Controller('moods')
@UseGuards(FirebaseAuthGuard)
export class MoodController {
  constructor(private readonly moodService: MoodService) {}

  @Get()
  async getMoodHistory(@CurrentUser() user: any) {
    return this.moodService.getMoodHistory(user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMood(@CurrentUser() user: any, @Body() dto: CreateMoodDto) {
    return this.moodService.createMood(user, dto);
  }

  @Get('latest')
  async getLatestMood(@CurrentUser() user: any) {
    return this.moodService.getLatestMood(user);
  }

  @Get('trends')
  async getMoodTrends(@CurrentUser() user: any) {
    return this.moodService.getMoodTrends(user);
  }
}
