import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth } from "@/lib/adminAuthHelper";

export async function GET(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const [auditLogs, totalLogs, notifications, webhooks] = await Promise.all([
      prisma.auditLog.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count(),
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
      pagination: {
        page,
        limit,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limit),
      },
      notifications,
      webhooks,
    });
  } catch (error: any) {
    console.error("Operations logs fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to load logs" }, { status: 500 });
  }
}
