import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkoutService } from '@/src/modules/checkout/application/checkout.service';
import prisma from '@/utils/db';

// Mock dependencies
vi.mock('@/utils/db', () => ({
  default: {
    productVariant: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      // Execute the transaction callback directly for testing
      return cb(prisma);
    }),
    customer_order: {
      create: vi.fn().mockResolvedValue({ id: 'test_order_id' }),
    },
    customer_order_product: {
      create: vi.fn(),
    },
    inventoryEvent: {
      create: vi.fn(),
    },
    cart: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    outboxEvent: {
      create: vi.fn(),
    },
    address: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    coupon: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    orderCoupon: {
      findFirst: vi.fn(),
      create: vi.fn(),
    }
  }
}));

vi.mock('@/src/modules/payments/application/payment-orchestrator.service', () => ({
  paymentOrchestrator: {
    initiatePayment: vi.fn().mockResolvedValue({
      provider: 'RAZORPAY',
      providerPaymentId: 'pay_1',
      status: 'REQUIRES_ACTION',
      clientAction: {
        type: 'SDK',
        publicKey: 'rzp_test_1',
        sessionId: 'ord_1',
      },
    }),
  },
}));

vi.mock('@/src/lib/idempotency', () => ({
  idempotencyService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('checkoutService.processCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validCheckoutInput = {
    cartId: 'cart_1',
    idempotencyKey: 'idem_key_1',
    userId: 'user_1',
    shippingDetails: {
      name: 'John',
      lastname: 'Doe',
      phone: '1234567890',
      email: 'john@example.com',
      company: '',
      adress: '123 Main St',
      apartment: '',
      postalCode: '12345',
      city: 'Metropolis',
      state: 'Delhi',
      country: 'USA'
    }
  };

  it('calculates totals and processes checkout', async () => {
    // Setup active cart mock
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: 'cart_1',
      items: [
        {
          variantId: 'v1',
          quantity: 2,
          variant: {
            id: 'v1',
            title: 'Product 1',
            price: 1000,
            stockQuantity: 10,
            reservedQuantity: 0,
            sku: 'SKU-V1',
            productId: 'p1',
            product: { title: 'Product 1', slug: 'product-1' }
          }
        }
      ]
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user_1',
      email: 'john@example.com'
    } as any);

    const result = await checkoutService.processCheckout(validCheckoutInput);

    expect(prisma.customer_order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          total: 2060, // 2 * 1000 minor units + GST (3%) computed by pricingService
          userId: 'user_1',
        })
      })
    );

    expect(result.orderId).toBe('test_order_id');
  });

  it('rejects checkout with empty cart', async () => {
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);

    await expect(checkoutService.processCheckout(validCheckoutInput)).rejects.toThrow('Cart is empty or not found');
  });

  it('rejects insufficient stock quantities', async () => {
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: 'cart_1',
      items: [
        {
          variantId: 'v1',
          quantity: 5,
          variant: {
            id: 'v1',
            title: 'Product 1',
            price: 1000,
            stockQuantity: 2,
            reservedQuantity: 0,
            product: { title: 'Product 1' }
          }
        }
      ]
    } as any);

    await expect(checkoutService.processCheckout(validCheckoutInput)).rejects.toThrow('Insufficient inventory for Product 1');
  });

  it('applies percentage coupon discount correctly', async () => {
    // Setup active cart mock
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: 'cart_1',
      items: [
        {
          variantId: 'v1',
          quantity: 2,
          variant: {
            id: 'v1',
            title: 'Product 1',
            price: 1000,
            stockQuantity: 10,
            reservedQuantity: 0,
            sku: 'SKU-V1',
            productId: 'p1',
            product: { title: 'Product 1', slug: 'product-1' }
          }
        }
      ]
    } as any);

    // Mock coupon lookup
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      id: 'coupon_pct',
      code: 'SAVE10',
      discountType: 'PERCENTAGE',
      value: 10,
      minOrderValue: 10,
      maxDiscount: null,
      startDate: new Date(Date.now() - 100000),
      endDate: new Date(Date.now() + 100000),
      usageLimit: 100,
      usedCount: 5,
      createdAt: new Date(),
    });
    vi.mocked(prisma.coupon.update).mockResolvedValue({} as any);
    vi.mocked(prisma.orderCoupon.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.orderCoupon.create).mockResolvedValue({} as any);

    const inputWithCoupon = {
      ...validCheckoutInput,
      couponCode: 'SAVE10'
    };

    const result = await checkoutService.processCheckout(inputWithCoupon);

    // Subtotal = 2000. 10% coupon = 200 discount.
    // Taxable subtotal = 1800. GST (3%) = 54.
    // Expected total = 1854.
    expect(prisma.customer_order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          total: 1854,
          userId: 'user_1',
        })
      })
    );
  });
});
