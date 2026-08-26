import { CheckContentDto } from './dto/check-content.dto';
export declare class ModerationService {
    private readonly forbiddenPatterns;
    checkContent(dto: CheckContentDto): Promise<{
        approved: boolean;
        reason: string;
    }>;
}
