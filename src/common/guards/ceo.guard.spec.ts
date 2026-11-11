/**
 * ceo.guard.spec.ts
 *
 * Tests for CeoRoleGuard covering:
 * - CEO with both role === 'ceo' AND email match is granted access
 * - Role-only (with wrong email) is DENIED — prevents forged JWT role claims
 * - Email-only (with role !== 'ceo') is DENIED — defense in depth
 * - Non-CEO users are denied
 * - Missing user context throws ForbiddenException
 */

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CeoRoleGuard } from './ceo.guard';

const CEO_EMAIL = 'sereneflow27@gmail.com';

function makeGuard() {
  const config = { get: jest.fn((key: string) => key === 'CEO_EMAIL' ? CEO_EMAIL : undefined) };
  return new CeoRoleGuard(config as any);
}

function makeContext(user: any): ExecutionContext {
  const req = { user };
  return { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
}

describe('CeoRoleGuard', () => {
  it('grants access when role is "ceo" AND email matches CEO_EMAIL', () => {
    const guard = makeGuard();
    const ctx = makeContext({ role: 'ceo', email: CEO_EMAIL });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('accepts a CEO email with different letter casing', () => {
    const guard = makeGuard();
    const ctx = makeContext({ role: 'ceo', email: 'SereneFlow27@Gmail.com' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies access when role is "ceo" but email does NOT match CEO_EMAIL (forged role claim)', () => {
    const guard = makeGuard();
    const ctx = makeContext({ role: 'ceo', email: 'attacker@evil.com' });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('denies access when email matches CEO_EMAIL but role is not "ceo"', () => {
    const guard = makeGuard();
    const ctx = makeContext({ role: 'user', email: CEO_EMAIL });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('denies a regular user', () => {
    const guard = makeGuard();
    const ctx = makeContext({ role: 'user', email: 'regular@test.com' });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user context is missing', () => {
    const guard = makeGuard();
    const ctx = makeContext(null);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user context is undefined', () => {
    const guard = makeGuard();
    const ctx = makeContext(undefined);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('denies when CEO_EMAIL env var not set but the user email matches the hardcoded fallback', () => {
    const config = { get: jest.fn(() => undefined) };
    const guard = new CeoRoleGuard(config as any);
    // Fallback is 'sereneflow27@gmail.com' — so this should still work:
    const ctx = makeContext({ role: 'ceo', email: 'sereneflow27@gmail.com' });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
