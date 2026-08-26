import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateAvatarDto } from './dto/update-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: any): Promise<any>;
    updateProfile(user: any, dto: UpdateProfileDto): Promise<any>;
    updateAvatar(user: any, dto: UpdateAvatarDto): Promise<any>;
    recordActivity(user: any): Promise<{
        message: string;
        lastActive: string;
    }>;
    deleteAccount(user: any): Promise<{
        message: string;
    }>;
}
