import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import prisma from "@/utils/db";
import crypto from "crypto";
import { recordAuditLog } from "@/lib/adminAuthHelper";

export const ELEVATED_COOKIE_NAME = "vamika_dba_token";
export const ELEVATED_SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Checks whether the incoming request has a valid elevated DBA session.
 */
export async function verifyElevatedSession(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized access" }, { status: 401 }), user: null };
  }

  const role = (session.user as any)?.role;
  if (role !== "admin") {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 }), user: session.user };
  }

  // Look for elevated token in header or cookies
  const token = req.headers.get("x-elevated-token") || req.cookies.get(ELEVATED_COOKIE_NAME)?.value;
  if (!token) {
    return {
      authorized: false,
      isElevated: false,
      user: session.user,
      response: NextResponse.json({ error: "Elevated database credentials required for this operation" }, { status: 403 }),
    };
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const elevatedRecord = await prisma.elevatedSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!elevatedRecord || elevatedRecord.userId !== (session.user as any).id) {
    return {
      authorized: false,
      isElevated: false,
      user: session.user,
      response: NextResponse.json({ error: "Invalid elevated database session" }, { status: 403 }),
    };
  }

  if (new Date() > elevatedRecord.expiresAt) {
    // Delete expired session
    await prisma.elevatedSession.delete({ where: { id: elevatedRecord.id } }).catch(() => {});
    return {
      authorized: false,
      isElevated: false,
      user: session.user,
      response: NextResponse.json({ error: "Elevated session expired. Please re-authenticate." }, { status: 403 }),
    };
  }

  return {
    authorized: true,
    isElevated: true,
    user: session.user,
    elevatedSessionId: elevatedRecord.id,
  };
}

/**
 * Creates an elevated session for a user upon verifying credentials/secret
 */
export async function createElevatedSession(userId: string, req: NextRequest) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + ELEVATED_SESSION_DURATION_MS);

  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || undefined;

  await prisma.elevatedSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: String(ipAddress),
      userAgent,
    },
  });

  await recordAuditLog({
    actorId: userId,
    action: "ELEVATED_DBA_ACCESS_GRANTED",
    entityType: "ElevatedSession",
    entityId: userId,
    newValue: { expiresAt },
    ipAddress: String(ipAddress),
  });

  return { rawToken, expiresAt };
}
