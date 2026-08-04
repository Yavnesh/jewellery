import prisma from '@/utils/db';
import { InventoryEventType, CartStatus, PaymentStatus } from '@prisma/client';
import { getActiveCart } from '@/app/actions/cart.actions';

interface CheckoutInput {
  name: string;
  lastname: string;
  phone: string;
  email: string;
  company: string;
  adress: string;
  apartment: string;
  postalCode: string;
  city: string;
  country: string;
  orderNotice?: string;
  userId?: string;
}

export async function processCheckout(input: CheckoutInput) {
  let cart: any;
  try {
    // 1. Fetch active cart
    cart = await getActiveCart();
    
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error("Cart is empty or not found");
    }

    // 2. Validate stock and calculate total securely on the server
    let orderTotal = 0;
  for (const item of cart.items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId }
    });

    if (!variant) throw new Error(`Variant ${item.variantId} not found`);

    const availableStock = variant.stockQuantity - variant.reservedQuantity;
    if (availableStock < item.quantity) {
      throw new Error(`Insufficient stock for variant ${variant.id}. Only ${availableStock} available.`);
    }

    orderTotal += (variant.price * item.quantity);
  }

  // Add standard dummy tax/shipping logic (match frontend expectations)
  // E.g., Shipping $5, Tax 20%
  const shipping = 5;
  const tax = orderTotal / 5;
  const finalTotal = Math.round(orderTotal + tax + shipping);

  // 3. Process Transaction
  const order = await prisma.$transaction(async (tx) => {
    // Create the order
    const newOrder = await tx.customer_order.create({
      data: {
        name: input.name,
        lastname: input.lastname,
        phone: input.phone,
        email: input.email,
        company: input.company,
        adress: input.adress,
        apartment: input.apartment,
        postalCode: input.postalCode,
        city: input.city,
        country: input.country,
        orderNotice: input.orderNotice,
        userId: input.userId || null,
        cartId: cart.id,
        total: finalTotal,
        status: "processing", // Legacy status field
        paymentStatus: PaymentStatus.PENDING,
      }
    });

    // Create order products, deduct stock, create inventory events
    for (const item of cart.items) {
      const variant = await tx.productVariant.findUniqueOrThrow({
        where: { id: item.variantId }
      });

      // Insert Order line item snapshot
      await tx.customer_order_product.create({
        data: {
          customerOrderId: newOrder.id,
          variantId: variant.id,
          productId: variant.productId, // optional backwards compatibility
          quantity: item.quantity,
          priceAtPurchase: variant.price
        }
      });

      // Deduct stock safely (prevent negative stock)
      await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          stockQuantity: { decrement: item.quantity }
        }
      });

      // Write to ledger
      await tx.inventoryEvent.create({
        data: {
          variantId: variant.id,
          type: InventoryEventType.ORDER_FULFILLMENT,
          quantity: -item.quantity,
          referenceId: newOrder.id,
          reason: "Checkout completed"
        }
      });
    }

    // 4. Mark Cart as converted
    await tx.cart.update({
      where: { id: cart.id },
      data: { status: CartStatus.CONVERTED }
    });

    // 5. Create Transactional Outbox Event for Notification
    await tx.outboxEvent.create({
      data: {
        eventType: "ORDER_CREATED",
        aggregateType: "ORDER",
        aggregateId: newOrder.id,
        payload: {
          orderId: newOrder.id,
        },
      }
    });

    return newOrder;
  });

  // 6. Generate Payment Intent using Provider
  const { DummyPaymentProvider } = await import('@/src/modules/payments/dummy.provider');
  const paymentProvider = new DummyPaymentProvider();
  
  const paymentIntent = await paymentProvider.createPaymentIntent({
    amount: order.total,
    currency: "USD",
    orderId: order.id,
    customerEmail: order.email,
  });

  return { order, paymentIntent };
  } catch (error: any) {
    // Enrich Sentry with business context on failure
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.withScope((scope) => {
        scope.setContext("checkout", {
          cartId: cart?.id,
          userId: input.userId || 'guest',
        });
        Sentry.captureException(error);
      });
    });
    
    // Also use Pino for structured backend logs
    const { logger } = await import('@/src/lib/logger/logger');
    logger.error({ cartId: cart?.id, error: error.message }, 'Checkout processing failed');

    throw error;
  }
}
