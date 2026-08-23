import { NextResponse } from 'next/server';
import prisma from '@/utils/db';
import { logger } from '@/src/lib/logger/logger';

// Mock Resend/Email service wrapper
async function sendEmailNotification(email: string, eventType: string, payload: any) {
  // In production, this would initialize the Resend client and send the template:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ ... });
  logger.info({ email, eventType, orderId: payload.orderId }, 'Mock email sent successfully via Resend');
  return true;
}

export async function GET() {
  try {
    // 1. Fetch pending outbox events in FIFO order
    const pendingEvents = await prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 10
    });

    let processedCount = 0;

    for (const outbox of pendingEvents) {
      try {
        const payload = typeof outbox.payload === 'string' ? JSON.parse(outbox.payload) : outbox.payload;

        // Perform external side effect (unlocked, retryable)
        if (outbox.eventType === 'ORDER_PAID') {
          await sendEmailNotification(payload.email, outbox.eventType, payload);
        }

        // Update event as processed successfully
        await prisma.outboxEvent.update({
          where: { id: outbox.id },
          data: {
            status: 'PROCESSED',
            processedAt: new Date()
          }
        });

        processedCount++;
      } catch (err: any) {
        logger.error({ outboxId: outbox.id, error: err.message }, 'Failed to process outbox event');
        const nextAttempts = outbox.attempts + 1;
        await prisma.outboxEvent.update({
          where: { id: outbox.id },
          data: {
            attempts: nextAttempts,
            status: nextAttempts >= 5 ? 'FAILED' : 'PENDING',
            lastError: err.message
          }
        });
      }
    }

    return NextResponse.json({ processedCount });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Outbox queue processor job failed');
    return NextResponse.json({ error: 'Outbox Processor Failed' }, { status: 500 });
  }
}
