import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JournalModule } from './journal/journal.module';
import { MoodModule } from './mood/mood.module';
import { SpacesModule } from './spaces/spaces.module';
import { AdminModule } from './admin/admin.module';
import { ModerationModule } from './moderation/moderation.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const isProd =
  process.env.APP_ENV === 'prod' ||
  process.env.NODE_ENV === 'production' ||
  process.env.GCLOUD_PROJECT === 'sereneflow-prod-bb1c6';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: isProd
        ? ['.env.sereneflow-prod-bb1c6', '.env.prod']
        : ['.env.local', '.env'],
    }),
    // Global rate limiting: max 60 requests per 60 seconds per IP.
    // Auth-sensitive endpoints (login, forgot-password, verify-email, reset-password)
    // use a tighter @Throttle() override defined on their controllers.
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000, // 60 seconds
        limit: 60,
      },
    ]),
    FirebaseModule,
    AuthModule,
    UsersModule,
    JournalModule,
    MoodModule,
    SpacesModule,
    AdminModule,
    ModerationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply the throttler guard globally to every route.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
