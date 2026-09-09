import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth } from "@/lib/adminAuthHelper";

export async function GET(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const [auditLogs, notifications, webhooks] = await Promise.all([
      prisma.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.findMany({
        take: 30,
        orderBy: { createdAt: "desc" },
        include: { order: { select: { id: true, total: true } } },
      }),
      prisma.incomingWebhookEvent.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      auditLogs,
      notifications,
      webhooks,
    });
  } catch (error: any) {
    console.error("Operations logs fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to load logs" }, { status: 500 });
  }
}
