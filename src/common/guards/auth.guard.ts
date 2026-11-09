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
        const ceoEmail = (this.configService.get<string>('CEO_EMAIL') || 'sereneflow27@gmail.com').toLowerCase();
        request.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          name: decodedToken.name || decodedToken.email?.split('@')[0],
          avatar: decodedToken.picture || null,
          role: (decodedToken.email || '').toLowerCase() === ceoEmail ? 'ceo' : 'user',
          isVerified: decodedToken.email_verified ?? true,
        };
        if (request.user.isVerified === false) {
          throw new UnauthorizedException('Email verification is required before using this account.');
        }
        return true;
      } catch (err) {
        // Re-throw real auth errors (e.g. isVerified check).
        // Only swallow Firebase token format failures to allow JWT fallback.
        if (err instanceof UnauthorizedException) throw err;
        // Fallback to local JWT token if Firebase token fails or in hybrid mode
      }
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new UnauthorizedException('Server configuration error: JWT_SECRET not set.');
      }
      const decoded: any = jwt.verify(token, secret);
      const ceoEmail = (this.configService.get<string>('CEO_EMAIL') || 'sereneflow27@gmail.com').toLowerCase();
      
      request.user = {
        uid: decoded.uid || decoded.sub,
        email: decoded.email,
        name: decoded.name || decoded.email?.split('@')[0],
        avatar: decoded.avatar || null,
        role: (decoded.email || '').toLowerCase() === ceoEmail ? 'ceo' : 'user',
        isVerified: decoded.isVerified ?? true,
      };
      if (request.user.isVerified === false) {
        throw new UnauthorizedException('Email verification is required before using this account.');
      }
      return true;
    } catch (e) {
      // Re-throw UnauthorizedException directly (e.g. isVerified check above or missing JWT_SECRET).
      // Only wrap unknown errors as "Invalid or expired".
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
