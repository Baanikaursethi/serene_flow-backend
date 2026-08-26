import { JournalService } from './journal.service';
import { CreateJournalDto, UpdateJournalDto } from './dto/create-journal.dto';
export declare class JournalController {
    private readonly journalService;
    constructor(journalService: JournalService);
    getEntries(user: any): Promise<any[]>;
    createEntry(user: any, dto: CreateJournalDto): Promise<any>;
    updateEntry(user: any, id: string, dto: UpdateJournalDto): Promise<any>;
    deleteEntry(user: any, id: string): Promise<{
        message: string;
        id: string;
    }>;
}
