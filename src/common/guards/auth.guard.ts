import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private firebaseService: FirebaseService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    const firebaseAuth = this.firebaseService.auth;
    if (firebaseAuth) {
      try {
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        const ceoEmail = this.configService.get<string>('CEO_EMAIL') || 'sereneflow27@gmail.com';
        request.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          name: decodedToken.name || decodedToken.email?.split('@')[0],
          avatar: decodedToken.picture || null,
          role: decodedToken.email === ceoEmail ? 'ceo' : 'user',
          isVerified: decodedToken.email_verified ?? true,
        };
        return true;
      } catch (err) {
        // Fallback to local JWT token if Firebase token fails or in hybrid mode
      }
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'super-secret-serene-flow-jwt-key';
      const decoded: any = jwt.verify(token, secret);
      const ceoEmail = this.configService.get<string>('CEO_EMAIL') || 'sereneflow27@gmail.com';
      
      request.user = {
        uid: decoded.uid || decoded.sub,
        email: decoded.email,
        name: decoded.name || decoded.email?.split('@')[0],
        avatar: decoded.avatar || null,
        role: decoded.email === ceoEmail ? 'ceo' : (decoded.role || 'user'),
        isVerified: decoded.isVerified ?? true,
      };
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
