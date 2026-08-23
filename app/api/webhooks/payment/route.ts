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

    // 2. Guarantee Idempotency (Check against PaymentEvent table first)
    const existingEvent = await prisma.paymentEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider: 'RAZORPAY',
          providerEventId: event.providerEventId
        }
      }
    });

    if (existingEvent) {
      logger.info({ eventId: event.providerEventId }, 'Webhook already processed (Idempotent replay prevention)');
      return NextResponse.json({ received: true, status: 'already_processed' });
    }

    // 3. Queue Webhook Event Asynchronously (Insert into IncomingWebhookEvent)
    await prisma.incomingWebhookEvent.create({
      data: {
        id: event.providerEventId, // Use provider's unique event ID as primary key
        provider: 'razorpay',
        payload: JSON.stringify(event),
        status: 'PENDING'
      }
    });

    // 4. Return 200 OK Immediately to Payment Gateway (Prevents timeouts)
    return NextResponse.json({ received: true, status: 'queued' });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Payment webhook queuing failed');
    return NextResponse.json({ error: 'Webhook Queuing Failed' }, { status: 400 });
  }
}
