import { Module } from '@nestjs/common';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';
import { ModerationModule } from '../moderation';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [ModerationModule, CommonModule],
  controllers: [SpacesController],
  providers: [SpacesService],
  exports: [SpacesService],
})
export class SpacesModule {}
