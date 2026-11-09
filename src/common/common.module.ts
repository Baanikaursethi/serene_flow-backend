import { Module } from '@nestjs/common';
import { FirebaseAuthGuard } from './guards/auth.guard';
import { CeoRoleGuard } from './guards/ceo.guard';
import { FirebaseModule } from '../firebase/firebase.module';

/**
 * CommonModule exports both injectable guards so any feature module
 * can import it without repeating the provider declarations.
 * FirebaseAuthGuard depends on FirebaseService (from FirebaseModule)
 * and ConfigService (globally available via ConfigModule.forRoot({ isGlobal: true })).
 */
@Module({
  imports: [FirebaseModule],
  providers: [FirebaseAuthGuard, CeoRoleGuard],
  exports: [FirebaseAuthGuard, CeoRoleGuard],
})
export class CommonModule {}
