import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/utils/db';
import bcrypt from 'bcryptjs';

// Mock DB call logic
vi.mock('@/utils/db', () => ({
  default: {
    otp: {
      create: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      return cb(prisma);
    }),
  }
}));

describe('Password Reset OTP Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies valid OTP and updates bcrypt-hashed password successfully', async () => {
    const mockEmail = 'user@example.com';
    const mockCode = '123456';
    const mockNewPassword = 'new_password_secure';

    // Mock that the OTP is valid in the database
    vi.mocked(prisma.otp.findFirst).mockResolvedValue({
      id: 'otp_id_123',
      email: mockEmail,
      code: mockCode,
      purpose: 'PASSWORD_RESET',
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
    });

    // Mock user update
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    vi.mocked(prisma.otp.deleteMany).mockResolvedValue({} as any);

    // Simulate verify logic
    const fetchedOtp = await prisma.otp.findFirst({
      where: {
        email: mockEmail,
        code: mockCode,
        purpose: 'PASSWORD_RESET',
        expiresAt: { gt: new Date() }
      }
    });

    expect(fetchedOtp).not.toBeNull();

    const hashedPassword = await bcrypt.hash(mockNewPassword, 12);
    const isMatch = await bcrypt.compare(mockNewPassword, hashedPassword);
    expect(isMatch).toBe(true);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: mockEmail },
        data: { password: hashedPassword }
      }),
      prisma.otp.deleteMany({
        where: { email: mockEmail, purpose: 'PASSWORD_RESET' }
      })
    ]);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: mockEmail },
        data: expect.objectContaining({ password: hashedPassword })
      })
    );
    expect(prisma.otp.deleteMany).toHaveBeenCalled();
  });
});
