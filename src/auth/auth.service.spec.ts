jest.mock('../firebase', () => ({ FirebaseService: class {} }));

const sendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail }));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: mockCreateTransport },
  createTransport: mockCreateTransport,
}));

import { AuthService } from './auth.service';

describe('AuthService password reset', () => {
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string | undefined> = {
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'serene@example.com',
        SMTP_PASS: 'app-password',
      };
      return values[key];
    }),
  };

  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue(undefined);
    mockCreateTransport.mockClear();
  });

  it('sends a reset code to an existing account', async () => {
    const users = new Map<string, any>([
      ['user@example.com', { email: 'user@example.com', resetCode: null }],
    ]);
    const service = new AuthService({
      getCollection: jest.fn((name: string) => name === 'users' ? users : new Map()),
    } as any, config as any);

    await service.forgotPassword({ email: 'user@example.com' });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com', subject: 'Serene Flow - Reset Your Password' }),
    );
  });

  it('does not report a reset email when SMTP delivery fails', async () => {
    const users = new Map<string, any>([
      ['user@example.com', { email: 'user@example.com', resetCode: null }],
    ]);
    sendMail.mockRejectedValue(new Error('SMTP unavailable'));
    const service = new AuthService({
      getCollection: jest.fn((name: string) => name === 'users' ? users : new Map()),
    } as any, config as any);

    await expect(service.forgotPassword({ email: 'user@example.com' })).rejects.toThrow(
      'Unable to send Serene Flow - Reset Your Password email to user@example.com',
    );
  });

  it('does not send or reveal a reset to an unregistered email', async () => {
    const users = new Map<string, any>();
    const service = new AuthService({
      getCollection: jest.fn((name: string) => name === 'users' ? users : new Map()),
    } as any, config as any);

    await expect(service.forgotPassword({ email: 'missing@example.com' })).resolves.toEqual({
      message: 'If an account with that email exists, a password reset code has been sent.',
    });
    expect(sendMail).not.toHaveBeenCalled();
  });
});
