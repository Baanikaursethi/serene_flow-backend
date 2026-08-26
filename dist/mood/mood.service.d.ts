import { FirebaseService } from '../firebase';
import { CreateMoodDto } from './dto/create-mood.dto';
export declare class MoodService {
    private firebaseService;
    constructor(firebaseService: FirebaseService);
    createMood(userPayload: any, dto: CreateMoodDto): Promise<{
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
    getMoodHistory(userPayload: any): Promise<any[]>;
    getLatestMood(userPayload: any): Promise<any>;
    getMoodTrends(userPayload: any): Promise<{
        totalCheckIns: number;
        averageRating: number;
        streak: number;
        distribution: Record<string, number>;
        recentTimeline: any[];
    }>;
}
