"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const firebase_1 = require("../../firebase");
const jwt = __importStar(require("jsonwebtoken"));
const config_1 = require("@nestjs/config");
let FirebaseAuthGuard = class FirebaseAuthGuard {
    firebaseService;
    configService;
    constructor(firebaseService, configService) {
        this.firebaseService = firebaseService;
        this.configService = configService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing or invalid Authorization header');
        }
        const token = authHeader.split('Bearer ')[1];
        if (!token) {
            throw new common_1.UnauthorizedException('Token not provided');
        }
        const firebaseAuth = this.firebaseService.auth;
        if (firebaseAuth) {
            try {
                const decodedToken = await firebaseAuth.verifyIdToken(token);
                const ceoEmail = this.configService.get('CEO_EMAIL') || 'sereneflow27@gmail.com';
                request.user = {
                    uid: decodedToken.uid,
                    email: decodedToken.email || '',
                    name: decodedToken.name || decodedToken.email?.split('@')[0],
                    avatar: decodedToken.picture || null,
                    role: decodedToken.email === ceoEmail ? 'ceo' : 'user',
                    isVerified: decodedToken.email_verified ?? true,
                };
                return true;
            }
            catch (err) {
            }
        }
        try {
            const secret = this.configService.get('JWT_SECRET') || 'super-secret-serene-flow-jwt-key';
            const decoded = jwt.verify(token, secret);
            const ceoEmail = this.configService.get('CEO_EMAIL') || 'sereneflow27@gmail.com';
            request.user = {
                uid: decoded.uid || decoded.sub,
                email: decoded.email,
                name: decoded.name || decoded.email?.split('@')[0],
                avatar: decoded.avatar || null,
                role: decoded.email === ceoEmail ? 'ceo' : (decoded.role || 'user'),
                isVerified: decoded.isVerified ?? true,
            };
            return true;
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid or expired authentication token');
        }
    }
};
exports.FirebaseAuthGuard = FirebaseAuthGuard;
exports.FirebaseAuthGuard = FirebaseAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_1.FirebaseService,
        config_1.ConfigService])
], FirebaseAuthGuard);
//# sourceMappingURL=auth.guard.js.map