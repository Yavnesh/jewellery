import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const startTime = Date.now();

    // 1. Database Connectivity & Query Latency
    let dbStatus = "HEALTHY";
    let dbLatencyMs = 0;
    try {
      const dbPingStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbPingStart;
    } catch (err: any) {
      dbStatus = "UNHEALTHY";
      console.error("[Observability] Database ping failure:", err);
    }

    // 2. Queue Telemetry: Outbox Events (Transactional Notifications & Emails)
    const [pendingOutbox, failedOutbox, processedOutboxCount, deadLetterOutbox] = await Promise.all([
      prisma.outboxEvent.count({ where: { status: "PENDING" } }),
      prisma.outboxEvent.count({ where: { status: "FAILED" } }),
      prisma.outboxEvent.count({ where: { status: "PROCESSED" } }),
      prisma.outboxEvent.findMany({
        where: { attempts: { gte: 5 } },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    // 3. Queue Telemetry: Incoming Payment Webhooks
    const [pendingWebhooks, failedWebhooks, processedWebhooksCount, recentFailedWebhooks] = await Promise.all([
      prisma.incomingWebhookEvent.count({ where: { status: "PENDING" } }),
      prisma.incomingWebhookEvent.count({ where: { status: "FAILED" } }),
      prisma.incomingWebhookEvent.count({ where: { status: "PROCESSED" } }),
      prisma.incomingWebhookEvent.findMany({
        where: { status: "FAILED" },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // 4. Cart Stock Reservation Health
    const activeReservations = await prisma.productVariant.aggregate({
      _sum: { reservedQuantity: true },
    });

    const stuckOrders = await prisma.customer_order.count({
      where: {
        status: "PENDING_PAYMENT",
        dateTime: { lt: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });

    // 5. System Health Determination
    let systemOverallHealth: "HEALTHY" | "DEGRADED" | "CRITICAL" = "HEALTHY";
    if (dbStatus === "UNHEALTHY") {
      systemOverallHealth = "CRITICAL";
    } else if (failedOutbox > 10 || failedWebhooks > 5 || stuckOrders > 20) {
      systemOverallHealth = "DEGRADED";
    }

    const payload = {
      systemStatus: systemOverallHealth,
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      queues: {
        outbox: {
          pending: pendingOutbox,
          failed: failedOutbox,
          processed: processedOutboxCount,
          deadLetters: deadLetterOutbox,
        },
        webhooks: {
          pending: pendingWebhooks,
          failed: failedWebhooks,
          processed: processedWebhooksCount,
          recentFailures: recentFailedWebhooks,
        },
      },
      inventoryReservations: {
        totalReservedQuantity: activeReservations._sum.reservedQuantity || 0,
        stuckExpiredOrders: stuckOrders,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        cronSecretConfigured: !!process.env.CRON_SECRET,
        sentryConfigured: !!process.env.SENTRY_DSN,
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error: any) {
    console.error("[Observability Error]:", error);
    return NextResponse.json({ error: error.message || "Observability check failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { action, id } = body;

    if (action === "RETRY_OUTBOX_EVENT" && id) {
      const outbox = await prisma.outboxEvent.findUnique({ where: { id } });
      if (!outbox) return NextResponse.json({ error: "Outbox record not found" }, { status: 404 });

      await prisma.outboxEvent.update({
        where: { id },
        data: {
          status: "PENDING",
          attempts: 0,
          lastError: null,
        },
      });

      await recordAuditLog({
        actorId: (auth.user as any)?.id || "admin",
        action: "RETRY_OUTBOX_EVENT",
        entityType: "OUTBOX_EVENT",
        entityId: id,
        oldValue: { previousStatus: outbox.status, attempts: outbox.attempts },
        newValue: { newStatus: "PENDING", resetAttempts: 0 },
      });

      return NextResponse.json({ success: true, message: `Outbox event ${id} reset to PENDING` });
    }

    if (action === "RETRY_WEBHOOK_EVENT" && id) {
      const webhook = await prisma.incomingWebhookEvent.findUnique({ where: { id } });
      if (!webhook) return NextResponse.json({ error: "Webhook record not found" }, { status: 404 });

      await prisma.incomingWebhookEvent.update({
        where: { id },
        data: { status: "PENDING" },
      });

      await recordAuditLog({
        actorId: (auth.user as any)?.id || "admin",
        action: "RETRY_WEBHOOK_EVENT",
        entityType: "INCOMING_WEBHOOK",
        entityId: id,
        oldValue: { previousStatus: webhook.status },
        newValue: { newStatus: "PENDING" },
      });

      return NextResponse.json({ success: true, message: `Webhook event ${id} requeued to PENDING` });
    }

    if (action === "RETRY_ALL_FAILED_OUTBOX") {
      const updated = await prisma.outboxEvent.updateMany({
        where: { status: "FAILED" },
        data: { status: "PENDING", attempts: 0 },
      });

      return NextResponse.json({ success: true, count: updated.count });
    }

    return NextResponse.json({ error: "Invalid action requested" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Action failed" }, { status: 500 });
  }
}
