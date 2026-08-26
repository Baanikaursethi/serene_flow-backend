import { SpacesService } from './spaces.service';
import { CreatePostDto, UpdatePostDto, AddReactionDto, AddReplyDto } from './dto';
export declare class SpacesController {
    private readonly spacesService;
    constructor(spacesService: SpacesService);
    getPosts(): Promise<any[]>;
    createPost(user: any, dto: CreatePostDto): Promise<{
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
    updatePost(user: any, id: string, dto: UpdatePostDto): Promise<any>;
    deletePost(user: any, id: string): Promise<{
        message: string;
        id: string;
    }>;
    toggleReaction(user: any, id: string, dto: AddReactionDto): Promise<{
        id: string;
        reactions: any;
    }>;
    addReply(user: any, id: string, dto: AddReplyDto): Promise<{
        id: string;
        text: string;
        time: string;
        anonymous: boolean;
        authorName: any;
        authorEmail: any;
    }>;
    getReplies(id: string): Promise<any>;
}
