import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getUsers(): Promise<any[]>;
    getLogs(): Promise<{
        email: any;
        time: any;
        type: string;
    }[]>;
    getStats(): Promise<{
        ceoEmail: string;
        totalUsers: number;
        activeToday: number;
        totalJournals: number;
        totalMoods: number;
        totalPosts: number;
        timestamp: string;
    }>;
    deletePostAsAdmin(id: string): Promise<{
        message: string;
        id: string;
    }>;
}
