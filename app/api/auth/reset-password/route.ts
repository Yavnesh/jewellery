import prisma from "@/utils/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Email, OTP and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // 1. Fetch valid OTP from database
    const validOtp = await prisma.passwordResetOtp.findFirst({
      where: {
        email: normalizedEmail,
        otp: otp.trim(),
        expiresAt: { gt: new Date() }
      }
    });

    if (!validOtp) {
      return NextResponse.json({ error: "Invalid or expired OTP token code" }, { status: 400 });
    }

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 14);

    // 3. Update User's password in database (atomic transaction)
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { email: normalizedEmail },
        data: { password: hashedPassword }
      });

      // 4. Delete the used OTP record
      await tx.passwordResetOtp.delete({
        where: { id: validOtp.id }
      });
    });

    return NextResponse.json({ success: true, message: "Password reset successful" });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "Failed to reset password", message: error.message }, { status: 500 });
  }
}
