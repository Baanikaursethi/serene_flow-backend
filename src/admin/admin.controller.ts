import {
  Controller,
  Delete,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { FirebaseAuthGuard } from '../common/guards/auth.guard';
import { CeoRoleGuard } from '../common/guards/ceo.guard';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(FirebaseAuthGuard, CeoRoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('logs')
  async getLogs() {
    return this.adminService.getLogs();
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Delete('spaces/posts/:id')
  async deletePostAsAdmin(@Param('id') id: string) {
    return this.adminService.deletePostAsAdmin(id);
  }
}
