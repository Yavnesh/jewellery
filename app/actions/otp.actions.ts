"use server";

import prisma from "@/utils/db";
import crypto from "crypto";
import { smsService } from "@/src/modules/notifications/application/sms.service";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function cleanPhoneSync(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (/^91\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return cleaned;
}

// Helper to sanitize and format phone number (E.164 compatible or standard 10-digit format)
export async function sanitizePhoneNumber(phone: string): Promise<string> {
  return cleanPhoneSync(phone);
}

// Helper to hash OTP code securely
function hashOtp(otp: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "vamika_otp_secret_key_2026";
  return crypto.createHmac("sha256", secret).update(otp).digest("hex");
}

export type OtpPurpose = "REGISTRATION" | "CHECKOUT";

export async function sendOtpAction({
  phone,
  purpose = "REGISTRATION",
}: {
  phone: string;
  purpose: OtpPurpose;
}) {
  try {
    const formattedPhone = cleanPhoneSync(phone);
    const digitsOnly = formattedPhone.replace(/\D/g, "");

    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return { success: false, error: "Please enter a valid 10-digit mobile number." };
    }

    // Rate Limiting: Max 3 requests in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentRequestsCount = await prisma.otpVerification.count({
      where: {
        phone: formattedPhone,
        purpose,
        createdAt: { gte: fiveMinutesAgo },
      },
    });

    if (recentRequestsCount >= 3) {
      return {
        success: false,
        error: "Too many OTP requests. Please wait 5 minutes before trying again.",
      };
    }

    // Generate secure 6-digit numeric OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashOtp(otpCode);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Delete any older unverified records for this phone & purpose to keep table lean
    await prisma.otpVerification.deleteMany({
      where: {
        phone: formattedPhone,
        purpose,
        verified: false,
      },
    });

    // Save new OTP record
    await prisma.otpVerification.create({
      data: {
        phone: formattedPhone,
        otpHash,
        purpose,
        expiresAt,
        verified: false,
        attempts: 0,
      },
    });

    // Send OTP via SMS Provider (Twilio / MSG91 / Gupshup / Mock)
    try {
      await smsService.get().sendOtp(formattedPhone, otpCode);
    } catch (smsError) {
      console.error("SMS dispatch error:", smsError);
    }

    const isDev = process.env.NODE_ENV !== "production";
    console.log(`\n========================================\n[VAMIKA OTP] Sent OTP: ${otpCode} to ${formattedPhone} (${purpose})\n========================================\n`);

    return {
      success: true,
      message: `OTP sent to ${formattedPhone}`,
      phone: formattedPhone,
      // Provide devOtp during local development so user can test effortlessly without live SMS balance
      devOtp: isDev ? otpCode : undefined,
    };
  } catch (error: any) {
    console.error("sendOtpAction error:", error);
    return { success: false, error: error.message || "Failed to send OTP. Please try again." };
  }
}

export async function verifyOtpAction({
  phone,
  otp,
  purpose = "REGISTRATION",
}: {
  phone: string;
  otp: string;
  purpose: OtpPurpose;
}) {
  try {
    const formattedPhone = cleanPhoneSync(phone);
    const cleanedOtp = otp.trim();

    if (!/^\d{6}$/.test(cleanedOtp)) {
      return { success: false, error: "Please enter a valid 6-digit OTP." };
    }

    // Find the latest active OTP record for this phone & purpose
    const record = await prisma.otpVerification.findFirst({
      where: {
        phone: formattedPhone,
        purpose,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return {
        success: false,
        error: "OTP has expired or was not requested. Please request a new OTP.",
      };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return {
        success: false,
        error: "Maximum verification attempts exceeded. Please request a new OTP.",
      };
    }

    const inputHash = hashOtp(cleanedOtp);

    if (record.otpHash !== inputHash) {
      // Increment attempt counter
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      const remainingAttempts = MAX_ATTEMPTS - (record.attempts + 1);
      return {
        success: false,
        error: `Incorrect OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : "Please request a new OTP."}`,
      };
    }

    // Mark as verified
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return {
      success: true,
      message: "Mobile number verified successfully.",
      phone: formattedPhone,
    };
  } catch (error: any) {
    console.error("verifyOtpAction error:", error);
    return { success: false, error: error.message || "Verification failed. Please try again." };
  }
}

// Helper to check if a phone has been verified for a purpose within the last 15 minutes
export async function isPhoneVerified(phone: string, purpose: OtpPurpose): Promise<boolean> {
  const formattedPhone = cleanPhoneSync(phone);
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const verifiedRecord = await prisma.otpVerification.findFirst({
    where: {
      phone: formattedPhone,
      purpose,
      verified: true,
      updatedAt: { gte: fifteenMinutesAgo },
    },
  });

  return !!verifiedRecord;
}
