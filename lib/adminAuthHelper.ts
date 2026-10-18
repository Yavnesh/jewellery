import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { NextResponse } from "next/server";
import prisma from "@/utils/db";

type AdminAuthResult =
  | { authorized: true; user: any; response?: undefined }
  | { authorized: false; user: any; response: NextResponse };

export function safeJson(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function verifyAdminAuth(): Promise<AdminAuthResult> {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized access" }, { status: 401 }),
      user: null
    };
  }

  const role = ((session.user as any)?.role || "").toLowerCase();
  const email = (session.user?.email || "").toLowerCase();
  const isSuperAdminEmail =
    email === "admin@vamikajewels.com" || email === "admin@vamiexports.com";

  if (role !== "admin" && role !== "superadmin" && !isSuperAdminEmail) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 }),
      user: session.user
    };
  }

  return { authorized: true, user: session.user };
}


export async function recordAuditLog({
  actorId,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
  ipAddress,
}: {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress: ipAddress || "127.0.0.1",
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
