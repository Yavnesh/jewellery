import prisma from '@/utils/db';
import { sendOrderConfirmation } from './notification.service';

export async function processOutboxEvents() {
  const pendingEvents = await prisma.outboxEvent.findMany({
    where: {
      status: { in: ['PENDING', 'RETRYING'] },
      // Optional: don't retry too fast
      // lastAttemptAt: { lt: new Date(Date.now() - 30 * 1000) } 
    },
    take: 50,
  });

  if (pendingEvents.length === 0) return { processed: 0, failed: 0 };

  let processedCount = 0;
  let failedCount = 0;

  for (const event of pendingEvents) {
    try {
      // Mark as processing
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { 
          status: 'PROCESSING',
          attempts: { increment: 1 },
          lastAttemptAt: new Date()
        }
      });

      if (event.eventType === 'ORDER_CREATED') {
        const payload = event.payload as { orderId: string };
        await sendOrderConfirmation(payload.orderId);
      }

      // Mark as completed
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { 
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });
      processedCount++;
    } catch (error: any) {
      console.error(`[Outbox Worker] Failed to process event ${event.id}:`, error);
      
      const newStatus = event.attempts >= 4 ? 'FAILED' : 'RETRYING';
      
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { 
          status: newStatus,
          lastError: error.message
        }
      });
      failedCount++;
    }
  }

  return { processed: processedCount, failed: failedCount };
}
