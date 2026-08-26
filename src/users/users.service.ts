import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase';
import { UpdateProfileDto, UpdateAvatarDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private firebaseService: FirebaseService) {}

  private async uploadBase64Image(base64Str: string, email: string): Promise<string> {
    const storage = this.firebaseService.storage;
    if (!storage) {
      this.logger.warn('Firebase Storage not initialized. Returning original string.');
      return base64Str;
    }

    // Check if it is a base64 data string
    const matches = base64Str.match(/^data:image\/([A-Za-z0-9+-]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // If it's a URL or doesn't match base64 data pattern, return as is
      return base64Str;
    }

    const imageExtension = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    try {
      const rawBucketName = this.firebaseService.app?.options.storageBucket;
      const bucketName = rawBucketName ? rawBucketName.replace(/^gs:\/\//, '') : undefined;
      const bucket = storage.bucket(bucketName);

      const filename = `avatars/${email.replace(/[@.]/g, '_')}_${Date.now()}.${imageExtension}`;
      const file = bucket.file(filename);

      await file.save(buffer, {
        metadata: {
          contentType: `image/${imageExtension}`,
        },
        public: true,
      });

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      this.logger.log(`Avatar successfully uploaded to Firebase Storage: ${publicUrl}`);
      return publicUrl;
    } catch (error: any) {
      this.logger.error(`Error uploading avatar to Firebase Storage: ${error.message}`);
      return base64Str;
    }
  }

  private getDocRefOrMemory(email: string) {
    const firestore = this.firebaseService.firestore;
    if (firestore) {
      return { firestore, ref: firestore.collection('users').doc(email) };
    }
    const users = this.firebaseService.getCollection('users');
    return { firestore: null, memoryUser: users.get(email), users };
  }

  async getProfile(userPayload: any) {
    const email = userPayload.email.toLowerCase();
    const firestore = this.firebaseService.firestore;
    let userData: any = null;

    if (firestore) {
      const doc = await firestore.collection('users').doc(email).get();
      if (doc.exists) {
        userData = doc.data();
      }
    } else {
      userData = this.firebaseService.getCollection('users').get(email);
    }

    if (!userData) {
      throw new NotFoundException('User profile not found');
    }

    // Calculate user stats
    let journalCount = 0;
    let moodCount = 0;
    let streak = 0;

    if (firestore) {
      const journalSnap = await firestore.collection('journals').where('userEmail', '==', email).get();
      journalCount = journalSnap.size;

      const moodSnap = await firestore.collection('moods').where('userEmail', '==', email).get();
      moodCount = moodSnap.size;
    } else {
      const journalsMap = this.firebaseService.getCollection('journals');
      journalCount = Array.from(journalsMap.values()).filter((j: any) => j.userEmail === email).length;

      const moodsMap = this.firebaseService.getCollection('moods');
      moodCount = Array.from(moodsMap.values()).filter((m: any) => m.userEmail === email).length;
    }

    // Calculate days using application
    const createdAt = new Date(userData.createdAt || Date.now());
    const daysActive = Math.max(1, Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));

    // Destructure out sensitive password hash
    const { password, resetToken, verificationCode, ...publicProfile } = userData;

    return {
      ...publicProfile,
      stats: {
        journalEntries: journalCount,
        moodCheckIns: moodCount,
        daysActive,
        streak: moodCount > 0 ? Math.min(moodCount, daysActive) : 0,
      },
    };
  }

  async updateProfile(userPayload: any, dto: UpdateProfileDto) {
    const email = userPayload.email.toLowerCase();
    const firestore = this.firebaseService.firestore;

    let avatarUrl = dto.avatar;
    if (dto.avatar) {
      avatarUrl = await this.uploadBase64Image(dto.avatar, email);
    }

    if (firestore) {
      const docRef = firestore.collection('users').doc(email);
      await docRef.update({
        ...(dto.name ? { name: dto.name } : {}),
        ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {}),
      });
      const updated = await docRef.get();
      const data = updated.data();
      delete data?.password;
      return data;
    } else {
      const users = this.firebaseService.getCollection('users');
      const user = users.get(email);
      if (!user) throw new NotFoundException('User not found');
      if (dto.name) user.name = dto.name;
      if (avatarUrl !== undefined) user.avatar = avatarUrl;
      users.set(email, user);
      const { password, ...rest } = user;
      return rest;
    }
  }

  async updateAvatar(userPayload: any, dto: UpdateAvatarDto) {
    return this.updateProfile(userPayload, { avatar: dto.avatar });
  }

  async recordActivity(userPayload: any) {
    const email = userPayload.email.toLowerCase();
    const firestore = this.firebaseService.firestore;
    const now = new Date().toISOString();

    if (firestore) {
      await firestore.collection('users').doc(email).update({ lastActive: now });
    } else {
      const users = this.firebaseService.getCollection('users');
      const user = users.get(email);
      if (user) {
        user.lastActive = now;
        users.set(email, user);
      }
    }

    return { message: 'Last active status updated', lastActive: now };
  }

  async deleteAccount(userPayload: any) {
    const email = userPayload.email.toLowerCase();
    const uid = userPayload.uid;
    const firestore = this.firebaseService.firestore;

    if (firestore) {
      // Cascade delete user data
      await firestore.collection('users').doc(email).delete();

      const journalBatch = firestore.batch();
      const journals = await firestore.collection('journals').where('userEmail', '==', email).get();
      journals.forEach((doc) => journalBatch.delete(doc.ref));
      await journalBatch.commit();

      const moodBatch = firestore.batch();
      const moods = await firestore.collection('moods').where('userEmail', '==', email).get();
      moods.forEach((doc) => moodBatch.delete(doc.ref));
      await moodBatch.commit();

      if (this.firebaseService.auth && uid) {
        try {
          await this.firebaseService.auth.deleteUser(uid);
        } catch {
          // ignore if already deleted
        }
      }
    } else {
      this.firebaseService.getCollection('users').delete(email);

      const journalsMap = this.firebaseService.getCollection('journals');
      Array.from(journalsMap.entries()).forEach(([k, v]: [string, any]) => {
        if (v.userEmail === email) journalsMap.delete(k);
      });

      const moodsMap = this.firebaseService.getCollection('moods');
      Array.from(moodsMap.entries()).forEach(([k, v]: [string, any]) => {
        if (v.userEmail === email) moodsMap.delete(k);
      });
    }

    return { message: 'Account and associated personal data deleted permanently.' };
  }
}
