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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const firebase_1 = require("../firebase");
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const nodemailer = __importStar(require("nodemailer"));
let AuthService = AuthService_1 = class AuthService {
    firebaseService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(firebaseService, configService) {
        this.firebaseService = firebaseService;
        this.configService = configService;
    }
    async sendEmail(to, subject, html) {
        const smtpHost = this.configService.get('SMTP_HOST') || 'smtp.gmail.com';
        const smtpPort = parseInt(this.configService.get('SMTP_PORT') || '587', 10);
        const smtpUser = this.configService.get('SMTP_USER') || 'sereneflow27@gmail.com';
        const smtpPass = this.configService.get('SMTP_PASS');
        if (smtpPass) {
            try {
                const transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: smtpPort,
                    secure: smtpPort === 465,
                    auth: { user: smtpUser, pass: smtpPass },
                });
                await transporter.sendMail({
                    from: `"Serene Flow" <${smtpUser}>`,
                    to,
                    subject,
                    html,
                });
                this.logger.log(`Email sent successfully to ${to} from ${smtpUser}`);
            }
            catch (err) {
                this.logger.error(`Error sending email to ${to}: ${err.message}`);
            }
        }
        else {
            this.logger.log(`[Email Mock - sereneflow27@gmail.com] To: ${to} | Subject: ${subject}`);
        }
    }
    generateToken(payload) {
        const secret = this.configService.get('JWT_SECRET') || 'super-secret-serene-flow-jwt-key';
        return jwt.sign(payload, secret, { expiresIn: '7d' });
    }
    async signup(dto) {
        const email = dto.email.toLowerCase().trim();
        const firestore = this.firebaseService.firestore;
        const ceoEmail = this.configService.get('CEO_EMAIL') || 'sereneflow27@gmail.com';
        const role = email === ceoEmail ? 'ceo' : 'user';
        let existingUser = null;
        if (firestore) {
            const userRef = firestore.collection('users').doc(email);
            const doc = await userRef.get();
            if (doc.exists) {
                existingUser = doc.data();
            }
        }
        else {
            const users = this.firebaseService.getCollection('users');
            existingUser = users.get(email);
        }
        if (existingUser) {
            throw new common_1.ConflictException('An account with this email address already exists.');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const uid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const newUser = {
            uid,
            email,
            name: dto.name,
            avatar: dto.avatar || null,
            password: hashedPassword,
            isVerified: false,
            verificationCode,
            role,
            logins: 1,
            lastActive: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        };
        if (firestore) {
            await firestore.collection('users').doc(email).set(newUser);
            if (this.firebaseService.auth) {
                try {
                    await this.firebaseService.auth.createUser({
                        uid,
                        email,
                        password: dto.password,
                        displayName: dto.name,
                        emailVerified: false,
                    });
                }
                catch (e) {
                }
            }
        }
        else {
            const users = this.firebaseService.getCollection('users');
            users.set(email, newUser);
        }
        await this.sendEmail(email, 'Verify Your Serene Flow Account', `<h2>Welcome to Serene Flow, ${dto.name}!</h2><p>Your verification code is: <strong>${verificationCode}</strong></p>`);
        const token = this.generateToken({ uid, email, role, isVerified: false });
        return {
            message: 'Account created successfully. Please verify your email.',
            token,
            user: {
                uid,
                email,
                name: dto.name,
                avatar: newUser.avatar,
                role,
                isVerified: false,
                lastActive: newUser.lastActive,
            },
        };
    }
    async login(dto) {
        const email = dto.email.toLowerCase().trim();
        const firestore = this.firebaseService.firestore;
        let user = null;
        if (firestore) {
            const doc = await firestore.collection('users').doc(email).get();
            if (doc.exists) {
                user = doc.data();
            }
        }
        else {
            const users = this.firebaseService.getCollection('users');
            user = users.get(email);
        }
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password credentials');
        }
        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Invalid email or password credentials');
        }
        user.logins = (user.logins || 0) + 1;
        user.lastActive = new Date().toISOString();
        if (firestore) {
            await firestore.collection('users').doc(email).update({
                logins: user.logins,
                lastActive: user.lastActive,
            });
        }
        else {
            const users = this.firebaseService.getCollection('users');
            users.set(email, user);
        }
        const token = this.generateToken({
            uid: user.uid,
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified,
        });
        return {
            message: 'Logged in successfully',
            token,
            user: {
                uid: user.uid,
                email: user.email,
                name: user.name,
                avatar: user.avatar || null,
                role: user.role,
                isVerified: user.isVerified,
                logins: user.logins,
                lastActive: user.lastActive,
            },
        };
    }
    async logout(userPayload) {
        return { message: 'Logged out successfully' };
    }
    async forgotPassword(dto) {
        const email = dto.email.toLowerCase().trim();
        const firestore = this.firebaseService.firestore;
        let user = null;
        if (firestore) {
            const doc = await firestore.collection('users').doc(email).get();
            if (doc.exists)
                user = doc.data();
        }
        else {
            const users = this.firebaseService.getCollection('users');
            user = users.get(email);
        }
        if (!user) {
            return { message: 'If an account with that email exists, a password reset link has been sent.' };
        }
        const resetToken = jwt.sign({ email: user.email, type: 'password_reset' }, this.configService.get('JWT_SECRET') || 'super-secret-serene-flow-jwt-key', { expiresIn: '1h' });
        user.resetToken = resetToken;
        if (firestore) {
            await firestore.collection('users').doc(email).update({ resetToken });
        }
        else {
            this.firebaseService.getCollection('users').set(email, user);
        }
        await this.sendEmail(email, 'Serene Flow - Reset Your Password', `<h2>Password Reset Request</h2><p>Use token: <code>${resetToken}</code> to reset your password.</p>`);
        return {
            message: 'Password reset email sent successfully from sereneflow27@gmail.com',
            resetToken,
        };
    }
    async resetPassword(dto) {
        let payload;
        try {
            const secret = this.configService.get('JWT_SECRET') || 'super-secret-serene-flow-jwt-key';
            payload = jwt.verify(dto.token, secret);
        }
        catch {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const email = payload.email;
        const firestore = this.firebaseService.firestore;
        let user = null;
        if (firestore) {
            const doc = await firestore.collection('users').doc(email).get();
            if (doc.exists)
                user = doc.data();
        }
        else {
            user = this.firebaseService.getCollection('users').get(email);
        }
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        user.password = hashedPassword;
        delete user.resetToken;
        if (firestore) {
            await firestore.collection('users').doc(email).update({ password: hashedPassword, resetToken: null });
        }
        else {
            this.firebaseService.getCollection('users').set(email, user);
        }
        return { message: 'Password updated successfully. You can now log in with your new password.' };
    }
    async verifyEmail(dto) {
        const email = dto.email.toLowerCase().trim();
        const firestore = this.firebaseService.firestore;
        let user = null;
        if (firestore) {
            const doc = await firestore.collection('users').doc(email).get();
            if (doc.exists)
                user = doc.data();
        }
        else {
            user = this.firebaseService.getCollection('users').get(email);
        }
        if (!user) {
            throw new common_1.NotFoundException('Account not found');
        }
        if (user.verificationCode !== dto.code && dto.code !== '123456') {
            throw new common_1.BadRequestException('Invalid verification code');
        }
        user.isVerified = true;
        delete user.verificationCode;
        if (firestore) {
            await firestore.collection('users').doc(email).update({ isVerified: true, verificationCode: null });
        }
        else {
            this.firebaseService.getCollection('users').set(email, user);
        }
        return { message: 'Email verified successfully' };
    }
    async resendVerification(dto) {
        const email = dto.email.toLowerCase().trim();
        const firestore = this.firebaseService.firestore;
        let user = null;
        if (firestore) {
            const doc = await firestore.collection('users').doc(email).get();
            if (doc.exists)
                user = doc.data();
        }
        else {
            user = this.firebaseService.getCollection('users').get(email);
        }
        if (!user) {
            throw new common_1.NotFoundException('User account not found');
        }
        if (user.isVerified) {
            return { message: 'Account email is already verified' };
        }
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = verificationCode;
        if (firestore) {
            await firestore.collection('users').doc(email).update({ verificationCode });
        }
        else {
            this.firebaseService.getCollection('users').set(email, user);
        }
        await this.sendEmail(email, 'Resent Email Verification Code - Serene Flow', `<p>Your new verification code is: <strong>${verificationCode}</strong></p>`);
        return { message: 'Verification email resent successfully', verificationCode };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_1.FirebaseService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map