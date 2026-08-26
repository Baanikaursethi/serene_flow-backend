"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FirebaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
let FirebaseService = FirebaseService_1 = class FirebaseService {
    configService;
    logger = new common_1.Logger(FirebaseService_1.name);
    firebaseApp = null;
    memoryDb = new Map();
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const projectId = this.configService.get('FIREBASE_PROJECT_ID') || this.configService.get('GOOGLE_PROJECT_ID');
        const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL') || this.configService.get('GOOGLE_CLIENT_EMAIL');
        let privateKey = this.configService.get('FIREBASE_PRIVATE_KEY') || this.configService.get('GOOGLE_PRIVATE_KEY');
        if (privateKey) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }
        if (projectId && clientEmail && privateKey) {
            this.logger.log('Production/Live credentials found. Forcing connection to live Firebase...');
            delete process.env.FIRESTORE_EMULATOR_HOST;
            delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
            delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;
            const apps = (0, app_1.getApps)();
            for (const app of apps) {
                try {
                    await (0, app_1.deleteApp)(app);
                }
                catch (e) {
                }
            }
            try {
                this.firebaseApp = (0, app_1.initializeApp)({
                    credential: (0, app_1.cert)({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                    storageBucket: this.configService.get('FIREBASE_STORAGE_BUCKET') || this.configService.get('GOOGLE_STORAGE_BUCKET'),
                });
                this.logger.log(`Firebase Admin initialized successfully for live project ${projectId}.`);
            }
            catch (err) {
                this.logger.error('Failed to initialize Firebase Admin SDK for live project', err.stack);
            }
        }
        else {
            const apps = (0, app_1.getApps)();
            if (apps.length > 0) {
                this.firebaseApp = apps[0];
                this.logger.log('Using existing Firebase App instance.');
            }
            else if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FUNCTIONS_EMULATOR) {
                this.firebaseApp = (0, app_1.initializeApp)({ projectId: projectId || 'serene-flow-9e7e4' });
                this.logger.log(`Firebase Admin connected to Local Emulator Suite (Project: ${projectId || 'serene-flow-9e7e4'}).`);
            }
            else {
                this.logger.warn('Firebase production credentials not set in .env. Running in standalone local development mode.');
            }
        }
    }
    get app() {
        return this.firebaseApp;
    }
    get auth() {
        return this.firebaseApp ? (0, auth_1.getAuth)(this.firebaseApp) : null;
    }
    get firestore() {
        const dbId = this.configService.get('FIRESTORE_DATABASE_ID') || '(default)';
        return this.firebaseApp ? (0, firestore_1.getFirestore)(this.firebaseApp, dbId) : null;
    }
    get storage() {
        return this.firebaseApp ? (0, storage_1.getStorage)(this.firebaseApp) : null;
    }
    getCollection(collectionName) {
        if (!this.memoryDb.has(collectionName)) {
            this.memoryDb.set(collectionName, new Map());
        }
        return this.memoryDb.get(collectionName);
    }
};
exports.FirebaseService = FirebaseService;
exports.FirebaseService = FirebaseService = FirebaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FirebaseService);
//# sourceMappingURL=firebase.service.js.map