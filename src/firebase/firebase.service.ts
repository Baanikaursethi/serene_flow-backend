import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: App | null = null;
  private memoryDb: Map<string, Map<string, any>> = new Map();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const projectId =
      this.configService.get<string>('FIREBASE_PROJECT_ID') ||
      this.configService.get<string>('GOOGLE_PROJECT_ID') ||
      'serene-flow-9e7e4';
    const clientEmail =
      this.configService.get<string>('FIREBASE_CLIENT_EMAIL') ||
      this.configService.get<string>('GOOGLE_CLIENT_EMAIL');
    let privateKey =
      this.configService.get<string>('FIREBASE_PRIVATE_KEY') ||
      this.configService.get<string>('GOOGLE_PRIVATE_KEY');
    const storageBucket =
      this.configService.get<string>('FIREBASE_STORAGE_BUCKET') ||
      this.configService.get<string>('GOOGLE_STORAGE_BUCKET');

    if (privateKey) {
      privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    }

    const existingApps = getApps();

    if (existingApps.length > 0) {
      this.firebaseApp = existingApps[0]!;
      this.logger.log(`Using existing Firebase App instance for project: ${this.firebaseApp.name}`);
      return;
    }

    if (clientEmail && privateKey) {
      try {
        this.firebaseApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          storageBucket,
        });
        this.logger.log(`Firebase Admin initialized successfully with service account for project: ${projectId}.`);
      } catch (err: any) {
        this.logger.error(`Failed to initialize Firebase Admin SDK with service account: ${err.message}`, err.stack);
      }
    } else {
      try {
        this.firebaseApp = initializeApp({
          projectId,
          storageBucket,
        });
        this.logger.log(`Firebase Admin initialized with default credentials for project: ${projectId}.`);
      } catch (err: any) {
        this.logger.warn(`Firebase Admin initialization fallback warning: ${err.message}`);
      }
    }
  }

  get app(): App | null {
    return this.firebaseApp;
  }

  get auth(): Auth | null {
    return this.firebaseApp ? getAuth(this.firebaseApp) : null;
  }

  get firestore(): Firestore | null {
    if (!this.firebaseApp) return null;
    const dbId = this.configService.get<string>('FIRESTORE_DATABASE_ID');
    if (dbId && dbId !== '(default)' && dbId !== 'default') {
      return getFirestore(this.firebaseApp, dbId);
    }
    return getFirestore(this.firebaseApp);
  }

  get storage(): Storage | null {
    return this.firebaseApp ? getStorage(this.firebaseApp) : null;
  }

  // Memory fallback storage for instant standalone development
  getCollection(collectionName: string): Map<string, any> {
    if (!this.memoryDb.has(collectionName)) {
      this.memoryDb.set(collectionName, new Map());
    }
    return this.memoryDb.get(collectionName)!;
  }
}
