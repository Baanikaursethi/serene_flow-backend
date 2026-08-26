import { FirebaseService } from '../firebase';
import { CreatePostDto, UpdatePostDto, AddReactionDto, AddReplyDto } from './dto';
import { ModerationService } from '../moderation';
export declare class SpacesService {
    private firebaseService;
    private moderationService;
    constructor(firebaseService: FirebaseService, moderationService: ModerationService);
    getPosts(): Promise<any[]>;
    createPost(userPayload: any, dto: CreatePostDto): Promise<{
        id: string;
        text: string;
        time: string;
        anonymous: boolean;
        authorName: any;
        authorEmail: any;
        authorUid: any;
        reactions: {};
        replies: never[];
    }>;
    updatePost(userPayload: any, id: string, dto: UpdatePostDto): Promise<any>;
    deletePost(userPayload: any, id: string): Promise<{
        message: string;
        id: string;
    }>;
    toggleReaction(userPayload: any, id: string, dto: AddReactionDto): Promise<{
        id: string;
        reactions: any;
    }>;
    addReply(userPayload: any, id: string, dto: AddReplyDto): Promise<{
        id: string;
        text: string;
        time: string;
        anonymous: boolean;
        authorName: any;
        authorEmail: any;
    }>;
    getReplies(id: string): Promise<any>;
}
