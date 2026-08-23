import prisma from "@/utils/db";
import { smsService } from "@/src/modules/notifications/application/sms.service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Verify user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // For security, don't reveal if user doesn't exist
      return NextResponse.json({ success: true, message: "If the user exists, an OTP has been sent" });
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Save OTP to database
    await prisma.passwordResetOtp.create({
      data: {
        email: email.toLowerCase(),
        otp,
        expiresAt
      }
    });

    // 4. Send OTP via configured SMS/WhatsApp gateway
    // If user profile has a phone number, send it there, otherwise default template logging
    const phone = user.phone || "+919999999999"; 
    await smsService.get().sendOtp(phone, otp);

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Failed to request password reset", message: error.message }, { status: 500 });
  }
}
