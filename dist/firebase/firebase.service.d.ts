import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App } from 'firebase-admin/app';
import { Auth } from 'firebase-admin/auth';
import { Firestore } from 'firebase-admin/firestore';
import { Storage } from 'firebase-admin/storage';
export declare class FirebaseService implements OnModuleInit {
    private configService;
    private readonly logger;
    private firebaseApp;
    private memoryDb;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    get app(): App | null;
    get auth(): Auth | null;
    get firestore(): Firestore | null;
    get storage(): Storage | null;
    getCollection(collectionName: string): Map<string, any>;
}
