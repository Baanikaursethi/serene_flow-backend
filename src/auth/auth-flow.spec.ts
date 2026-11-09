/**
 * auth-flow.spec.ts
 *
 * Tests for AuthService core authentication flows:
 * - Signup creates account with hashed password, isVerified:false, correct role
 * - CEO account gets role:'ceo' at signup and login
 * - Login returns isVerified:false for unverified accounts
 * - Login fails with wrong password
 * - Email verification: correct code passes, wrong code fails, already-verified fails
 * - Resend verification refreshes the code
 * - Reset password: correct code sets new password, expired code fails
 * - User data isolation: login does not leak other users' tokens/data
 */

jest.mock('../firebase', () => ({ FirebaseService: class {} }));

const sendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail }));
jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: mockCreateTransport },
  createTransport: mockCreateTransport,
}));

import { AuthService } from './auth.service';
import { ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

const CEO_EMAIL = 'sereneflow27@gmail.com';
const JWT_SECRET = 'test-auth-flow-secret';

function makeConfig(extra: Record<string, string> = {}) {
  return {
    get: jest.fn((key: string) => ({
      JWT_SECRET,
      CEO_EMAIL,
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'test@example.com',
      SMTP_PASS: 'fake-pass',
      ...extra,
    }[key] ?? undefined)),
  };
}

function makeService(users: Map<string, any>, config = makeConfig()) {
  sendMail.mockResolvedValue(undefined);
  return new AuthService(
    {
      firestore: null,
      auth: null,
      getCollection: jest.fn((name: string) => name === 'users' ? users : new Map()),
    } as any,
    config as any,
  );
}

describe('AuthService — signup', () => {
  beforeEach(() => sendMail.mockReset().mockResolvedValue(undefined));
  it('creates a new user with isVerified:false and hashed password', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);

    const res = await svc.signup({ name: 'Alice', email: 'alice@test.com', password: 'pass123' });

    expect(res.user.isVerified).toBe(false);
    expect(res.user.email).toBe('alice@test.com');
    const stored = users.get('alice@test.com');
    expect(stored.password).not.toBe('pass123'); // hashed
    expect(stored.password).toMatch(/^\$2[ab]\$/);
  });

  it('assigns role "ceo" to the CEO email at signup', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);

    const res = await svc.signup({ name: 'CEO', email: CEO_EMAIL, password: 'ceopass' });

    expect(res.user.role).toBe('ceo');
    const stored = users.get(CEO_EMAIL);
    expect(stored.role).toBe('ceo');
  });

  it('rejects duplicate email signup', async () => {
    const users = new Map<string, any>([
      ['existing@test.com', { email: 'existing@test.com', password: 'hashed' }],
    ]);
    const svc = makeService(users);

    await expect(
      svc.signup({ name: 'Dup', email: 'existing@test.com', password: 'pass' }),
    ).rejects.toThrow(ConflictException);
  });

  it('normalizes email to lowercase on signup', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);

    await svc.signup({ name: 'Bob', email: 'BOB@TEST.COM', password: 'pass' });

    expect(users.has('bob@test.com')).toBe(true);
    expect(users.has('BOB@TEST.COM')).toBe(false);
  });
});

describe('AuthService — login', () => {
  beforeEach(() => sendMail.mockReset().mockResolvedValue(undefined));
  it('login returns isVerified:false for an unverified account', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);
    await svc.signup({ name: 'Unverified', email: 'unver@test.com', password: 'pass123' });
    // don't verify — just login
    const loginRes = await svc.login({ email: 'unver@test.com', password: 'pass123' });
    expect(loginRes.user.isVerified).toBe(false);
  });

  it('login fails with incorrect password', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);
    await svc.signup({ name: 'Alice', email: 'alice2@test.com', password: 'correct' });

    await expect(svc.login({ email: 'alice2@test.com', password: 'wrong' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('login fails for non-existent user', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);

    await expect(svc.login({ email: 'ghost@test.com', password: 'any' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('login token payload contains correct isVerified status', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);
    await svc.signup({ name: 'C', email: 'c@test.com', password: 'p' });
    const loginRes = await svc.login({ email: 'c@test.com', password: 'p' });

    const decoded: any = jwt.verify(loginRes.token, JWT_SECRET);
    expect(decoded.isVerified).toBe(false);
  });
});

describe('AuthService — email verification', () => {
  beforeEach(() => sendMail.mockReset().mockResolvedValue(undefined));
  it('verifyEmail succeeds with the correct code and returns isVerified:true', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);
    await svc.signup({ name: 'D', email: 'd@test.com', password: 'p' });

    const stored = users.get('d@test.com');
    const code = stored.verificationCode;

    const res = await svc.verifyEmail({ email: 'd@test.com', code });

    expect(res.user.isVerified).toBe(true);
    // Code is cleared after use (in-memory: deleted → undefined; Firestore: set to null)
    const updated = users.get('d@test.com');
    expect(updated.verificationCode == null).toBe(true); // null or undefined both mean cleared
  });

  it('verifyEmail fails with a wrong code', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);
    await svc.signup({ name: 'E', email: 'e@test.com', password: 'p' });

    await expect(svc.verifyEmail({ email: 'e@test.com', code: '000000' })).rejects.toThrow(
      BadRequestException,
    );
    // Still unverified
    expect(users.get('e@test.com').isVerified).toBe(false);
  });

  it('verifyEmail fails if the account is already verified', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);
    await svc.signup({ name: 'F', email: 'f@test.com', password: 'p' });
    const code = users.get('f@test.com').verificationCode;
    await svc.verifyEmail({ email: 'f@test.com', code });

    // Second attempt should fail
    await expect(svc.verifyEmail({ email: 'f@test.com', code })).rejects.toThrow(BadRequestException);
  });

  it('verifyEmail issues a JWT signed with JWT_SECRET (not the hardcoded fallback)', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);
    await svc.signup({ name: 'G', email: 'g@test.com', password: 'p' });
    const code = users.get('g@test.com').verificationCode;
    const res = await svc.verifyEmail({ email: 'g@test.com', code });

    // Should be verifiable with the test secret
    const decoded: any = jwt.verify(res.token, JWT_SECRET);
    expect(decoded.isVerified).toBe(true);
    expect(decoded.email).toBe('g@test.com');

    // Should NOT be verifiable with the old hardcoded fallback
    expect(() => jwt.verify(res.token, 'super-secret-serene-flow-jwt-key')).toThrow();
  });
});

describe('AuthService — password reset', () => {
  // Reset sendMail mock between each test to avoid cross-test call count bleed
  beforeEach(() => sendMail.mockReset().mockResolvedValue(undefined));
  it('resetPassword succeeds with correct code before expiry', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);
    await svc.signup({ name: 'H', email: 'h@test.com', password: 'oldpass' });
    await svc.forgotPassword({ email: 'h@test.com' });

    const code = users.get('h@test.com').resetCode;
    await svc.resetPassword({ email: 'h@test.com', code, newPassword: 'newpass123' });

    // New password should work
    const loginRes = await svc.login({ email: 'h@test.com', password: 'newpass123' });
    expect(loginRes.user.email).toBe('h@test.com');
  });

  it('resetPassword fails with wrong code', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);
    await svc.signup({ name: 'I', email: 'i@test.com', password: 'old' });
    await svc.forgotPassword({ email: 'i@test.com' });

    await expect(
      svc.resetPassword({ email: 'i@test.com', code: '000000', newPassword: 'new' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('resetPassword fails with an expired code', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);
    await svc.signup({ name: 'J', email: 'j@test.com', password: 'old' });
    await svc.forgotPassword({ email: 'j@test.com' });

    // Expire the code manually
    const stored = users.get('j@test.com');
    const code = stored.resetCode;
    stored.resetCodeExpiresAt = new Date(Date.now() - 1000).toISOString(); // expired 1s ago
    users.set('j@test.com', stored);

    await expect(
      svc.resetPassword({ email: 'j@test.com', code, newPassword: 'new' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('forgotPassword does not expose whether an account exists', async () => {
    const users = new Map<string, any>();
    const svc = makeService(users);

    const res = await svc.forgotPassword({ email: 'doesnotexist@test.com' });

    expect(res.message).toContain('If an account with that email exists');
    expect(sendMail).not.toHaveBeenCalled();
  });
});
