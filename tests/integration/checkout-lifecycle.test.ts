import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webhookProcessor } from '@/src/modules/payments/application/payment-verification.service';
import prisma from '@/utils/db';

// Mock DB call logic
vi.mock('@/utils/db', () => ({
  default: {
    paymentEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    customer_order: {
      update: vi.fn(),
    },
    productVariant: {
      update: vi.fn(),
    },
    inventoryEvent: {
      create: vi.fn(),
    },
    cart: {
      update: vi.fn(),
    },
    outboxEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      return cb(prisma);
    }),
  }
}));

describe('Payment Webhook Processing & Idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockWebhookEvent = {
    eventId: 'evt_razorpay_duplicate_123',
    type: 'payment.captured',
    provider: 'RAZORPAY' as const,
    payload: {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_captured_123',
            amount: 1000,
            currency: 'INR',
            order_id: 'order_rzp_123',
          }
        }
      }
    }
  };

  it('stops processing immediately if the webhook event is already logged as processed', async () => {
    // Mock that the event is already in the database
    vi.mocked(prisma.paymentEvent.findUnique).mockResolvedValue({
      id: 'existing_db_event_id',
      provider: 'RAZORPAY',
      providerEventId: 'evt_razorpay_duplicate_123',
      eventType: 'payment.captured',
      payload: {},
      processedAt: new Date(),
      createdAt: new Date(),
    });

    await webhookProcessor.process(mockWebhookEvent);

    // Should return early and not create any new paymentEvent logs
    expect(prisma.paymentEvent.create).not.toHaveBeenCalled();
    expect(prisma.payment.findFirst).not.toHaveBeenCalled();
  });

  it('persists a new webhook event and processes the transaction successfully', async () => {
    // Mock that the event is NOT already in the database
    vi.mocked(prisma.paymentEvent.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.paymentEvent.create).mockResolvedValue({ id: 'saved_event_id' } as any);

    // Mock order and payment records
    vi.mocked(prisma.payment.findFirst).mockResolvedValue({
      id: 'pay_rec_123',
      orderId: 'order_db_123',
      provider: 'RAZORPAY',
      status: 'PENDING',
      order: {
        id: 'order_db_123',
        cartId: 'cart_123',
        products: [
          { variantId: 'v1', quantity: 1 }
        ]
      }
    } as any);

    await webhookProcessor.process(mockWebhookEvent);

    // Should create the event log
    expect(prisma.paymentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerEventId: 'evt_razorpay_duplicate_123',
        })
      })
    );

    // Should update payment status to SUCCEEDED
    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay_rec_123' },
        data: { status: 'SUCCEEDED' }
      })
    );

    // Should deduct product variant inventories
    expect(prisma.productVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'v1' },
        data: expect.objectContaining({
          stockQuantity: expect.objectContaining({ decrement: 1 }),
        })
      })
    );
  });
});
