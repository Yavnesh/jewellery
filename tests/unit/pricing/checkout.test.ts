import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processCheckout } from '@/lib/checkout/checkout.service';
import prisma from '@/utils/db';
import { getActiveCart } from '@/app/actions/cart.actions';

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
      update: vi.fn(),
    },
    outboxEvent: {
      create: vi.fn(),
    }
  }
}));

vi.mock('@/app/actions/cart.actions', () => ({
  getActiveCart: vi.fn()
}));

describe('processCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validCheckoutInput = {
    name: 'John',
    lastname: 'Doe',
    phone: '1234567890',
    email: 'john@example.com',
    company: '',
    adress: '123 Main St',
    apartment: '',
    postalCode: '12345',
    city: 'Metropolis',
    country: 'USA'
  };

  it('calculates totals from database prices', async () => {
    // Setup active cart mock
    vi.mocked(getActiveCart).mockResolvedValue({
      id: 'cart_1',
      items: [
        { variantId: 'v1', quantity: 2 },
        { variantId: 'v2', quantity: 1 }
      ]
    } as any);

    // Setup variant mock
    vi.mocked(prisma.productVariant.findUnique).mockImplementation(async ({ where }) => {
      if ((where as any).id === 'v1') return { id: 'v1', price: 1000, stockQuantity: 10, reservedQuantity: 0 } as any;
      if ((where as any).id === 'v2') return { id: 'v2', price: 2000, stockQuantity: 5, reservedQuantity: 0 } as any;
      return null;
    });

    vi.mocked(prisma.productVariant.findUniqueOrThrow).mockImplementation(async ({ where }) => {
      if ((where as any).id === 'v1') return { id: 'v1', price: 1000, stockQuantity: 10, reservedQuantity: 0 } as any;
      if ((where as any).id === 'v2') return { id: 'v2', price: 2000, stockQuantity: 5, reservedQuantity: 0 } as any;
      throw new Error();
    });

    await processCheckout(validCheckoutInput);

    // 2 * 1000 + 1 * 2000 = 4000
    // Tax = 4000 / 5 = 800
    // Shipping = 5
    // Final Total = 4805

    expect(prisma.customer_order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          total: 4805
        })
      })
    );
  });

  it('rejects unavailable products', async () => {
    vi.mocked(getActiveCart).mockResolvedValue({
      id: 'cart_1',
      items: [
        { variantId: 'v1', quantity: 1 }
      ]
    } as any);

    // Simulate missing variant
    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(null);

    await expect(processCheckout(validCheckoutInput)).rejects.toThrow('Variant v1 not found');
  });

  it('rejects invalid quantities', async () => {
    vi.mocked(getActiveCart).mockResolvedValue({
      id: 'cart_1',
      items: [
        { variantId: 'v1', quantity: 10 }
      ]
    } as any);

    // Simulate insufficient stock (only 5 available)
    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue({
      id: 'v1',
      price: 1000,
      stockQuantity: 5,
      reservedQuantity: 0
    } as any);

    await expect(processCheckout(validCheckoutInput)).rejects.toThrow('Insufficient stock for variant v1. Only 5 available.');
  });
});
