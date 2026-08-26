import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CeoRoleGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const ceoEmail = this.configService.get<string>('CEO_EMAIL') || 'sereneflow27@gmail.com';

    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    const isCeo = user.role === 'ceo' || user.email === ceoEmail;
    if (!isCeo) {
      throw new ForbiddenException('Access restricted exclusively to CEO/Administrator account');
    }

    return true;
  }
}
