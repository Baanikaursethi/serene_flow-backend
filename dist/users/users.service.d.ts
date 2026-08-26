import { FirebaseService } from '../firebase';
import { UpdateProfileDto, UpdateAvatarDto } from './dto/update-profile.dto';
export declare class UsersService {
    private firebaseService;
    private readonly logger;
    constructor(firebaseService: FirebaseService);
    private uploadBase64Image;
    private getDocRefOrMemory;
    getProfile(userPayload: any): Promise<any>;
    updateProfile(userPayload: any, dto: UpdateProfileDto): Promise<any>;
    updateAvatar(userPayload: any, dto: UpdateAvatarDto): Promise<any>;
    recordActivity(userPayload: any): Promise<{
        message: string;
        lastActive: string;
    }>;
    deleteAccount(userPayload: any): Promise<{
        message: string;
    }>;
}
