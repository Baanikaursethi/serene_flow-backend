import { ModerationService } from './moderation.service';
import { CheckContentDto } from './dto/check-content.dto';
export declare class ModerationController {
    private readonly moderationService;
    constructor(moderationService: ModerationService);
    checkSpacesContent(dto: CheckContentDto): Promise<{
        approved: boolean;
        reason: string;
    }>;
}
