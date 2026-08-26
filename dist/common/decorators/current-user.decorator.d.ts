export interface UserPayload {
    uid: string;
    email: string;
    name?: string;
    avatar?: string | null;
    role?: string;
    isVerified?: boolean;
}
export declare const CurrentUser: (...dataOrPipes: (keyof UserPayload | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
