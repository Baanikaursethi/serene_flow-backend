import { CanActivate, ExecutionContext } from '@nestjs/common';
import { FirebaseService } from '../../firebase';
import { ConfigService } from '@nestjs/config';
export declare class FirebaseAuthGuard implements CanActivate {
    private firebaseService;
    private configService;
    constructor(firebaseService: FirebaseService, configService: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
