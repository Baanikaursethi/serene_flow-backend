import { FirebaseService } from '../firebase';
import { CreateJournalDto, UpdateJournalDto } from './dto/create-journal.dto';
export declare class JournalService {
    private firebaseService;
    constructor(firebaseService: FirebaseService);
    getUserEntries(userPayload: any): Promise<any[]>;
    createEntry(userPayload: any, dto: CreateJournalDto): Promise<any>;
    updateEntry(userPayload: any, id: string, dto: UpdateJournalDto): Promise<any>;
    deleteEntry(userPayload: any, id: string): Promise<{
        message: string;
        id: string;
    }>;
}
