import { BadRequestException, Injectable } from '@nestjs/common';
import { CheckContentDto } from './dto/check-content.dto';

@Injectable()
export class ModerationService {
  private readonly forbiddenPatterns: RegExp[] = [
    /\b(suicide|self-harm|kill myself|end my life)\b/i,
    /\b(hate|slur|racist)\b/i,
  ];

  async checkContent(dto: CheckContentDto) {
    const text = dto.text;

    for (const pattern of this.forbiddenPatterns) {
      if (pattern.test(text)) {
        throw new BadRequestException({
          approved: false,
          reason: 'Content contains restricted or inappropriate language.',
        });
      }
    }

    return {
      approved: true,
      reason: 'Content passes moderation checks.',
    };
  }
}
