import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApps, cert, App, deleteApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: App | null = null;
  private memoryDb: Map<string, Map<string, any>> = new Map();

  constructor(private configService: ConfigService) { }

  async onModuleInit() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID') || this.configService.get<string>('GOOGLE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL') || this.configService.get<string>('GOOGLE_CLIENT_EMAIL');
    let privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY') || this.configService.get<string>('GOOGLE_PRIVATE_KEY');

    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if (projectId && clientEmail && privateKey) {
      this.logger.log('Production/Live credentials found. Forcing connection to live Firebase...');

      // Disable emulator connection by deleting the emulator host variables
      delete process.env.FIRESTORE_EMULATOR_HOST;
      delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
      delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;

      // Delete any existing default apps initialized by the emulator framework
      const apps = getApps();
      for (const app of apps) {
        try {
          await deleteApp(app);
        } catch (e) {
          // ignore
        }
      }

      try {
        this.firebaseApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET') || this.configService.get<string>('GOOGLE_STORAGE_BUCKET'),
        });
        this.logger.log(`Firebase Admin initialized successfully for live project ${projectId}.`);
      } catch (err: any) {
        this.logger.error('Failed to initialize Firebase Admin SDK for live project', err.stack);
      }
    } else {
      const apps = getApps();
      if (apps.length > 0) {
        this.firebaseApp = apps[0]!;
        this.logger.log('Using existing Firebase App instance.');
      } else if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FUNCTIONS_EMULATOR) {
        this.firebaseApp = initializeApp({ projectId: projectId || 'serene-flow-9e7e4' });
        this.logger.log(`Firebase Admin connected to Local Emulator Suite (Project: ${projectId || 'serene-flow-9e7e4'}).`);
      } else {
        this.logger.warn('Firebase production credentials not set in .env. Running in standalone local development mode.');
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
    const dbId = this.configService.get<string>('FIRESTORE_DATABASE_ID') || '(default)';
    return this.firebaseApp ? getFirestore(this.firebaseApp, dbId) : null;
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
