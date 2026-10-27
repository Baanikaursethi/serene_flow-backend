import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../firebase';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private firebaseService: FirebaseService,
    private configService: ConfigService,
  ) {}

  private async sendEmail(to: string, subject: string, html: string) {
    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
    const smtpUser = this.configService.get<string>('SMTP_USER') || 'sereneflow27@gmail.com';
    let smtpPass = this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('SMTP_PASS_LOCAL');
    if (smtpPass) {
      smtpPass = smtpPass.replace(/\s+/g, '');
    }

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
      } catch (err: any) {
        this.logger.error(`Error sending email to ${to}: ${err.message}`);
        throw new Error(`Unable to send ${subject} email to ${to}`);
      }
    } else {
      this.logger.log(`[Email Mock - ${smtpUser}] To: ${to} | Subject: ${subject}`);
    }
  }

  private generateToken(payload: object): string {
    const secret = this.configService.get<string>('JWT_SECRET') || 'super-secret-serene-flow-jwt-key';
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }

  async signup(dto: SignupDto) {
    const email = dto.email.toLowerCase().trim();
    const firestore = this.firebaseService.firestore;
    const ceoEmail = this.configService.get<string>('CEO_EMAIL') || 'sereneflow27@gmail.com';
    const role = email === ceoEmail.toLowerCase() ? 'ceo' : 'user';

    let existingUser: any = null;

    if (firestore) {
      const userRef = firestore.collection('users').doc(email);
      const doc = await userRef.get();
      if (doc.exists) {
        existingUser = doc.data();
      }
    } else {
      const users = this.firebaseService.getCollection('users');
      existingUser = users.get(email);
    }

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists.');
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
      // Also sync to Firebase Auth if initialized
      if (this.firebaseService.auth) {
        try {
          await this.firebaseService.auth.createUser({
            uid,
            email,
            password: dto.password,
            displayName: dto.name,
            emailVerified: false,
          });
        } catch (e) {
          // ignore sync duplicate error if exists
        }
      }
    } else {
      const users = this.firebaseService.getCollection('users');
      users.set(email, newUser);
    }

    // Send verification email
    try {
      await this.sendEmail(
        email,
        'Verify Your Serene Flow Account',
        `<h2>Welcome to Serene Flow, ${dto.name}!</h2><p>Your verification code is: <strong>${verificationCode}</strong></p>`,
      );
    } catch (e: any) {
      this.logger.warn(`Could not send verification email to ${email}: ${e.message}`);
    }

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

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const firestore = this.firebaseService.firestore;
    let user: any = null;

    if (firestore) {
      const doc = await firestore.collection('users').doc(email).get();
      if (doc.exists) {
        user = doc.data();
      }
    } else {
      const users = this.firebaseService.getCollection('users');
      user = users.get(email);
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    // Update logins count and last active timestamp
    user.logins = (user.logins || 0) + 1;
    user.lastActive = new Date().toISOString();

    if (firestore) {
      await firestore.collection('users').doc(email).update({
        logins: user.logins,
        lastActive: user.lastActive,
      });
    } else {
      const users = this.firebaseService.getCollection('users');
      users.set(email, user);
    }

    const ceoEmail = this.configService.get<string>('CEO_EMAIL') || 'sereneflow27@gmail.com';
    const role = email === ceoEmail.toLowerCase() ? 'ceo' : 'user';

    // Keep the stored role aligned with the configured CEO account so an old
    // CEO address cannot retain privileges after the account is changed.
    if (user.role !== role) {
      user.role = role;
      if (firestore) {
        await firestore.collection('users').doc(email).update({ role });
      } else {
        this.firebaseService.getCollection('users').set(email, user);
      }
    }

    const token = this.generateToken({
      uid: user.uid,
      email: user.email,
      name: user.name,
      avatar: user.avatar || null,
      role,
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
        role,
        isVerified: user.isVerified,
        logins: user.logins,
        lastActive: user.lastActive,
      },
    };
  }

  async logout(userPayload: any) {
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const firestore = this.firebaseService.firestore;
    let user: any = null;

    if (firestore) {
      const doc = await firestore.collection('users').doc(email).get();
      if (doc.exists) user = doc.data();
    } else {
      user = this.firebaseService.getCollection('users').get(email);
    }

    // Do not reveal whether an account exists.
    if (!user) {
      return { message: 'If an account with that email exists, a password reset code has been sent.' };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    if (firestore) {
      await firestore.collection('users').doc(email).update({ resetCode, resetCodeExpiresAt });
    } else {
      user.resetCode = resetCode;
      user.resetCodeExpiresAt = resetCodeExpiresAt;
      this.firebaseService.getCollection('users').set(email, user);
    }

    await this.sendEmail(
      email,
      'Serene Flow - Reset Your Password',
      `<h2>Password Reset Request</h2><p>Your 6-digit password reset code is: <strong>${resetCode}</strong></p><p>This code expires in 1 hour.</p>`,
    );

    return { message: 'Password reset code sent successfully.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const firestore = this.firebaseService.firestore;
    let user: any = null;

    if (firestore) {
      const doc = await firestore.collection('users').doc(email).get();
      if (doc.exists) user = doc.data();
    } else {
      user = this.firebaseService.getCollection('users').get(email);
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const expiresAt = user.resetCodeExpiresAt ? new Date(user.resetCodeExpiresAt).getTime() : 0;
    if (user.resetCode !== dto.code || !expiresAt || Date.now() > expiresAt) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    if (firestore) {
      await firestore.collection('users').doc(email).update({
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiresAt: null,
      });
    } else {
      user.password = hashedPassword;
      delete user.resetCode;
      delete user.resetCodeExpiresAt;
      this.firebaseService.getCollection('users').set(email, user);
    }

    return { message: 'Password updated successfully. You can now log in with your new password.' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.toLowerCase().trim();
    const firestore = this.firebaseService.firestore;
    let user: any = null;

    if (firestore) {
      const doc = await firestore.collection('users').doc(email).get();
      if (doc.exists) user = doc.data();
    } else {
      user = this.firebaseService.getCollection('users').get(email);
    }

    if (!user) {
      throw new NotFoundException('Account not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account email is already verified');
    }

    // Never accept a fixed or fallback verification code.
    if (user.verificationCode !== dto.code) {
      throw new BadRequestException('Invalid verification code');
    }

    user.isVerified = true;
    delete user.verificationCode;

    if (firestore) {
      await firestore.collection('users').doc(email).update({ isVerified: true, verificationCode: null });
      if (this.firebaseService.auth && user.uid) {
        try {
          await this.firebaseService.auth.updateUser(user.uid, { emailVerified: true });
        } catch {
          // Custom Firestore/JWT auth remains authoritative if Firebase Auth sync is unavailable.
        }
      }
    } else {
      this.firebaseService.getCollection('users').set(email, user);
    }

    const token = this.generateToken({
      uid: user.uid,
      email: user.email,
      name: user.name,
      avatar: user.avatar || null,
      role: user.role,
      isVerified: true,
    });

    return {
      message: 'Email verified successfully',
      token,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        avatar: user.avatar || null,
        role: user.role,
        isVerified: true,
        logins: user.logins || 1,
        lastActive: user.lastActive,
        createdAt: user.createdAt,
      },
    };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const email = dto.email.toLowerCase().trim();
    const firestore = this.firebaseService.firestore;
    let user: any = null;

    if (firestore) {
      const doc = await firestore.collection('users').doc(email).get();
      if (doc.exists) user = doc.data();
    } else {
      user = this.firebaseService.getCollection('users').get(email);
    }

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    if (user.isVerified) {
      return { message: 'Account email is already verified' };
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;

    if (firestore) {
      await firestore.collection('users').doc(email).update({ verificationCode });
    } else {
      this.firebaseService.getCollection('users').set(email, user);
    }

    await this.sendEmail(
      email,
      'Resent Email Verification Code - Serene Flow',
      `<p>Your new verification code is: <strong>${verificationCode}</strong></p>`,
    );

    return { message: 'Verification email resent successfully' };
  }
}
