import { MoodService } from './mood.service';
import { CreateMoodDto } from './dto/create-mood.dto';
export declare class MoodController {
    private readonly moodService;
    constructor(moodService: MoodService);
    getMoodHistory(user: any): Promise<any[]>;
    createMood(user: any, dto: CreateMoodDto): Promise<{
        id: string;
        userEmail: any;
        userId: any;
        rating: number;
        moodLabel: string;
        emotions: string[];
        notes: string;
        recommendedExercise: string | null;
        timestamp: string;
    }>;
    getLatestMood(user: any): Promise<any>;
    getMoodTrends(user: any): Promise<{
        totalCheckIns: number;
        averageRating: number;
        streak: number;
        distribution: Record<string, number>;
        recentTimeline: any[];
    }>;
}
