/**
 * auth.guard.spec.ts
 *
 * Tests for FirebaseAuthGuard covering:
 * - Verified JWT is accepted
 * - Unverified JWT returns "Email verification required" (not "Invalid or expired")
 * - Missing / malformed token returns 401
 * - Missing JWT_SECRET returns configuration error (not a silent fallback)
 * - UnauthorizedException from inner checks is re-thrown, not swallowed
 */

import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { FirebaseAuthGuard } from './auth.guard';
import * as jwt from 'jsonwebtoken';

const CEO_EMAIL = 'sereneflow27@gmail.com';
const TEST_SECRET = 'test-unit-secret-not-production';

function makeToken(payload: object, secret = TEST_SECRET) {
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

function makeContext(token?: string): ExecutionContext {
  const req: any = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    user: null,
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function makeGuard(jwtSecret: string | undefined = TEST_SECRET) {
  const firebase = { auth: null }; // no Firebase Auth — use JWT-only path
  const config = { get: jest.fn((key: string) => {
    if (key === 'JWT_SECRET') return jwtSecret;
    if (key === 'CEO_EMAIL') return CEO_EMAIL;
    return undefined;
  })};
  return new FirebaseAuthGuard(firebase as any, config as any);
}

describe('FirebaseAuthGuard — JWT path', () => {
  it('accepts a valid verified token and sets request.user', async () => {
    const token = makeToken({ uid: 'u1', email: 'user@test.com', role: 'user', isVerified: true });
    const ctx = makeContext(token);
    const guard = makeGuard();

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    const req: any = ctx.switchToHttp().getRequest();
    expect(req.user.email).toBe('user@test.com');
    expect(req.user.isVerified).toBe(true);
  });

  it('returns 401 with "Email verification required" for isVerified:false token — not "Invalid or expired"', async () => {
    const token = makeToken({ uid: 'u2', email: 'unverified@test.com', role: 'user', isVerified: false });
    const ctx = makeContext(token);
    const guard = makeGuard();

    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Email verification is required before using this account.',
    );
  });

  it('the isVerified:false error is an UnauthorizedException, not a generic error', async () => {
    const token = makeToken({ uid: 'u3', email: 'unverified@test.com', role: 'user', isVerified: false });
    const ctx = makeContext(token);
    const guard = makeGuard();

    try {
      await guard.canActivate(ctx);
      fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(UnauthorizedException);
      expect((e as UnauthorizedException).message).toBe(
        'Email verification is required before using this account.',
      );
    }
  });

  it('rejects a token signed with wrong secret', async () => {
    const token = makeToken({ uid: 'u4', email: 'user@test.com', isVerified: true }, 'wrong-secret');
    const ctx = makeContext(token);
    const guard = makeGuard(TEST_SECRET);

    await expect(guard.canActivate(ctx)).rejects.toThrow('Invalid or expired authentication token');
  });

  it('rejects when no Authorization header is present', async () => {
    const ctx = makeContext(undefined);
    const guard = makeGuard();

    await expect(guard.canActivate(ctx)).rejects.toThrow('Missing or invalid Authorization header');
  });

  it('rejects when Authorization header is malformed', async () => {
    const req: any = { headers: { authorization: 'NotBearer abc' }, user: null };
    const ctx = { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
    const guard = makeGuard();

    await expect(guard.canActivate(ctx)).rejects.toThrow('Missing or invalid Authorization header');
  });

  it('throws a configuration error (not "Invalid or expired") when JWT_SECRET is not set', async () => {
    const token = makeToken({ uid: 'u5', email: 'user@test.com', isVerified: true });
    const ctx = makeContext(token);
    // Use a plain object (not jest.fn) so the undefined return is not intercepted
    const configNoSecret = {
      get: (key: string) => {
        if (key === 'JWT_SECRET') return undefined;
        if (key === 'CEO_EMAIL') return CEO_EMAIL;
        return undefined;
      },
    };
    const firebase = { auth: null };
    const guard = new FirebaseAuthGuard(firebase as any, configNoSecret as any);

    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Server configuration error: JWT_SECRET not set.',
    );
  });

  it('assigns role "ceo" to the CEO email, "user" to everyone else', async () => {
    const ceoToken = makeToken({ uid: 'ceo1', email: CEO_EMAIL, role: 'ceo', isVerified: true });
    const userToken = makeToken({ uid: 'u6', email: 'other@test.com', role: 'user', isVerified: true });

    const ceoCtx = makeContext(ceoToken);
    const userCtx = makeContext(userToken);
    const guard = makeGuard();

    await guard.canActivate(ceoCtx);
    await guard.canActivate(userCtx);

    const ceoReq: any = ceoCtx.switchToHttp().getRequest();
    const userReq: any = userCtx.switchToHttp().getRequest();
    expect(ceoReq.user.role).toBe('ceo');
    expect(userReq.user.role).toBe('user');
  });
});
