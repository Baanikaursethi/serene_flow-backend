import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JournalService } from './journal.service';
import { FirebaseAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateJournalDto, UpdateJournalDto } from './dto/create-journal.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Journals')
@ApiBearerAuth('JWT-auth')
@Controller('journal')
@UseGuards(FirebaseAuthGuard)
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get()
  async getEntries(@CurrentUser() user: any) {
    return this.journalService.getUserEntries(user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEntry(@CurrentUser() user: any, @Body() dto: CreateJournalDto) {
    return this.journalService.createEntry(user, dto);
  }

  @Patch(':id')
  async updateEntry(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateJournalDto,
  ) {
    return this.journalService.updateEntry(user, id, dto);
  }

  @Delete(':id')
  async deleteEntry(@CurrentUser() user: any, @Param('id') id: string) {
    return this.journalService.deleteEntry(user, id);
  }
}
