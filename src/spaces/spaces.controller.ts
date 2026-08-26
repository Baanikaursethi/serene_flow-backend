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
import { SpacesService } from './spaces.service';
import { FirebaseAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePostDto, UpdatePostDto, AddReactionDto, AddReplyDto } from './dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Spaces')
@ApiBearerAuth('JWT-auth')
@Controller('spaces')
@UseGuards(FirebaseAuthGuard)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get('posts')
  async getPosts() {
    return this.spacesService.getPosts();
  }

  @Post('posts')
  @HttpCode(HttpStatus.CREATED)
  async createPost(@CurrentUser() user: any, @Body() dto: CreatePostDto) {
    return this.spacesService.createPost(user, dto);
  }

  @Patch('posts/:id')
  async updatePost(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.spacesService.updatePost(user, id, dto);
  }

  @Delete('posts/:id')
  async deletePost(@CurrentUser() user: any, @Param('id') id: string) {
    return this.spacesService.deletePost(user, id);
  }

  @Post('posts/:id/reactions')
  @HttpCode(HttpStatus.OK)
  async toggleReaction(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AddReactionDto,
  ) {
    return this.spacesService.toggleReaction(user, id, dto);
  }

  @Post('posts/:id/replies')
  @HttpCode(HttpStatus.CREATED)
  async addReply(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AddReplyDto,
  ) {
    return this.spacesService.addReply(user, id, dto);
  }

  @Get('posts/:id/replies')
  async getReplies(@Param('id') id: string) {
    return this.spacesService.getReplies(id);
  }
}
