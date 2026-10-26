import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
  providers: [AppService],
})
export class AppModule {}
