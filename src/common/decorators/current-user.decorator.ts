import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  uid: string;
  email: string;
  name?: string;
  avatar?: string | null;
  role?: string;
  isVerified?: boolean;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
