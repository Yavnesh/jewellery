import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import prisma from "@/utils/db";
import bcrypt from "bcryptjs";
import {
  createElevatedSession,
  verifyElevatedSession,
  ELEVATED_COOKIE_NAME,
} from "@/lib/elevatedAuthHelper";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password or DBA passkey is required" }, { status: 400 });
    }

    // Lookup user in DB to verify password
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "User credential record not found" }, { status: 400 });
    }

    // Verify DBA step-up password against user password OR specific DBA master key from env
    const isPasswordValid = await bcrypt.compare(password, user.password);
    const isDbaMasterKeyValid =
      process.env.DBA_ELEVATED_PASSKEY &&
      password === process.env.DBA_ELEVATED_PASSKEY;

    if (!isPasswordValid && !isDbaMasterKeyValid) {
      return NextResponse.json({ error: "Invalid credentials for elevated access" }, { status: 401 });
    }

    const { rawToken, expiresAt } = await createElevatedSession(user.id, req);

    const response = NextResponse.json({
      success: true,
      message: "Elevated database administrator access granted",
      expiresAt,
    });

    response.cookies.set(ELEVATED_COOKIE_NAME, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Error in elevated auth:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const elevatedCheck = await verifyElevatedSession(req);
    if (!elevatedCheck.authorized || !elevatedCheck.isElevated) {
      return NextResponse.json({ isElevated: false });
    }

    return NextResponse.json({
      isElevated: true,
      user: {
        id: (elevatedCheck.user as any)?.id,
        email: (elevatedCheck.user as any)?.email,
      },
    });
  } catch (error) {
    return NextResponse.json({ isElevated: false });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get(ELEVATED_COOKIE_NAME)?.value;
    if (token) {
      const crypto = await import("crypto");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      await prisma.elevatedSession.deleteMany({ where: { tokenHash } });
    }

    const response = NextResponse.json({ success: true, message: "Elevated session revoked" });
    response.cookies.delete(ELEVATED_COOKIE_NAME);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
