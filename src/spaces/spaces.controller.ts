import {
  BadRequestException,
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
  async getPosts(@CurrentUser() user: any) {
    return this.spacesService.getPosts(user);
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
  async getReplies(@CurrentUser() user: any, @Param('id') id: string) {
    return this.spacesService.getReplies(user, id);
  }

  @Patch('posts/:postId/replies/:replyId')
  async updateReply(
    @CurrentUser() user: any,
    @Param('postId') postId: string,
    @Param('replyId') replyId: string,
    @Body('text') text: string,
  ) {
    if (typeof text !== 'string' || !text.trim()) {
      throw new BadRequestException('Reply text is required');
    }
    return this.spacesService.updateReply(user, postId, replyId, text.trim());
  }

  @Delete('posts/:postId/replies/:replyId')
  async deleteReply(
    @CurrentUser() user: any,
    @Param('postId') postId: string,
    @Param('replyId') replyId: string,
  ) {
    return this.spacesService.deleteReply(user, postId, replyId);
  }
}
