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
          attempts: { increment: 1 }
        }
      });

      if (event.eventType === 'ORDER_PAID') {
        const payload = event.payload as { orderId: string };
        await sendOrderConfirmation(payload.orderId);
      } else if (event.eventType === 'ORDER_SHIPPED' || event.eventType === 'ORDER_DELIVERED') {
        const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : (event.payload as any);
        if (payload?.phone) {
          const { smsService } = await import('./application/sms.service');
          const messageText = event.eventType === 'ORDER_SHIPPED'
            ? `Your Vamika Jewels order #${(payload.orderId || '').slice(0, 8).toUpperCase()} has shipped via ${payload.carrier || 'our courier'}. Tracking AWB: ${payload.trackingNumber || 'Available in account'}.`
            : `Your Vamika Jewels order #${(payload.orderId || '').slice(0, 8).toUpperCase()} has been successfully delivered. Thank you for choosing Vamika.`;

          await smsService.get().sendSms(payload.phone, messageText);
        }
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
