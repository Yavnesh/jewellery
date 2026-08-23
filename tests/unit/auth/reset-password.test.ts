import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as forgotPasswordHandler } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordHandler } from "@/app/api/auth/reset-password/route";
import prisma from "@/utils/db";

vi.mock("@/utils/db", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordResetOtp: {
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      return cb(prisma);
    }),
  }
}));

vi.mock("@/src/modules/notifications/application/sms.service", () => ({
  smsService: {
    get: vi.fn().mockReturnValue({
      sendOtp: vi.fn().mockResolvedValue(true)
    })
  }
}));

describe("Forgot & Reset Password OTP Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles forgot password OTP generation request", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "test@example.com",
      phone: "+919876543210"
    } as any);

    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" })
    });

    const response = await forgotPasswordHandler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.passwordResetOtp.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "test@example.com",
          otp: expect.any(String)
        })
      })
    );
  });

  it("resets password successfully when valid OTP is submitted", async () => {
    vi.mocked(prisma.passwordResetOtp.findFirst).mockResolvedValue({
      id: "otp1",
      email: "test@example.com",
      otp: "123456",
      expiresAt: new Date(Date.now() + 100000)
    } as any);

    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        otp: "123456",
        newPassword: "secretPassword"
      })
    });

    const response = await resetPasswordHandler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "test@example.com" },
        data: expect.objectContaining({
          password: expect.any(String)
        })
      })
    );
    expect(prisma.passwordResetOtp.delete).toHaveBeenCalledWith({
      where: { id: "otp1" }
    });
  });

  it("rejects password reset with invalid OTP", async () => {
    vi.mocked(prisma.passwordResetOtp.findFirst).mockResolvedValue(null);

    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        otp: "wrong_otp",
        newPassword: "secretPassword"
      })
    });

    const response = await resetPasswordHandler(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid or expired OTP token code");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
