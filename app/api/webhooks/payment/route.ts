import { NextResponse } from 'next/server';
import { DummyPaymentProvider } from '@/src/modules/payments/dummy.provider';
import prisma from '@/utils/db';
import { logger } from '@/src/lib/logger/logger';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') || req.headers.get('x-provider-signature') || '';

  const paymentProvider = new DummyPaymentProvider();

  try {
    // 1. Verify Webhook Authenticity
    const event = await paymentProvider.verifyWebhook({ rawBody, signature });

    // 2. Guarantee Idempotency (prevent double processing)
    // In Prisma, we can use a unique constraint on providerEventId
    try {
      await prisma.paymentEvent.create({
        data: {
          providerEventId: event.providerEventId,
          eventType: event.type,
          payload: event.data,
        }
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Unique constraint violation means we already processed this exact webhook ID
        logger.info({ eventId: event.providerEventId }, 'Webhook already processed (Idempotent replay)');
        return NextResponse.json({ received: true, status: 'already_processed' });
      }
      throw e;
    }

    // 3. Handle Business Logic (e.g. updating order status to PAID)
    if (event.type === 'payment_intent.succeeded') {
      const orderId = event.data.metadata?.orderId;
      if (orderId) {
        await prisma.customer_order.update({
          where: { id: orderId },
          data: { paymentStatus: 'PAID' }
        });
        
        // Mark event as fully processed
        await prisma.paymentEvent.update({
          where: { providerEventId: event.providerEventId },
          data: { processedAt: new Date() }
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Payment webhook failed');
    return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 400 });
  }
}
