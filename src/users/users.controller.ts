import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto, UpdateAvatarDto } from './dto/update-profile.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user);
  }

  @Patch('me')
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user, dto);
  }

  @Patch('me/avatar')
  async updateAvatar(@CurrentUser() user: any, @Body() dto: UpdateAvatarDto) {
    return this.usersService.updateAvatar(user, dto);
  }

  @Post('me/activity')
  @HttpCode(HttpStatus.OK)
  async recordActivity(@CurrentUser() user: any) {
    return this.usersService.recordActivity(user);
  }

  @Delete('me')
  async deleteAccount(@CurrentUser() user: any) {
    return this.usersService.deleteAccount(user);
  }
}
