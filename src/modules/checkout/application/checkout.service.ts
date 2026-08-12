import prisma from "@/utils/db";
import { pricingService } from "./pricing.service";
import { paymentOrchestrator } from "@/src/modules/payments/application/payment-orchestrator.service";
import { idempotencyService } from "@/src/lib/idempotency";
import { OrderStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export type CheckoutRequest = {
  cartId: string;
  shippingAddressId: string;
  billingAddressId?: string;
  userId: string;
  idempotencyKey: string;
};

export class CheckoutService {
  async processCheckout(input: CheckoutRequest) {
    // 1. Idempotency Check
    const existingResult = await idempotencyService.get(input.idempotencyKey);
    if (existingResult) {
      return existingResult;
    }

    // 2. Load Cart
    const cart = await prisma.cart.findFirst({
      where: {
        id: input.cartId,
        userId: input.userId, // Ownership check
        status: "ACTIVE",
      },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty or not found");
    }

    // 3. Validate Inventory & Prepare Pricing Input
    const pricingItems = cart.items.map((item) => {
      if (item.variant.stockQuantity - item.variant.reservedQuantity < item.quantity) {
        throw new Error(`Insufficient inventory for ${item.variant.title}`);
      }
      return {
        variantId: item.variantId,
        quantity: item.quantity,
        unitPriceMinor: item.variant.price,
        discountMinor: 0, // Placeholder
      };
    });

    // 4. Calculate Pricing
    const pricing = await pricingService.calculate({
      items: pricingItems,
      currency: "INR", // Fixed to INR as per standard
    });

    // Load user/address details for the order
    const address = await prisma.address.findFirst({
      where: { id: input.shippingAddressId, userId: input.userId },
    });
    const user = await prisma.user.findUnique({ where: { id: input.userId } });

    if (!address || !user) throw new Error("Invalid address or user");

    // 5. Create Order & Line Items (Atomic Transaction)
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.customer_order.create({
        data: {
          userId: input.userId,
          cartId: cart.id,
          name: address.firstName,
          lastname: address.lastName,
          email: user.email,
          phone: address.phone,
          company: "",
          adress: address.line1,
          apartment: address.line2 || "",
          city: address.city,
          country: address.countryCode,
          postalCode: address.postalCode,
          total: pricing.total.amountMinor, // Stored as minor unit, might need migration on existing codebase
          status: "PENDING_PAYMENT", // Cast appropriately if mapped to OrderStatus enum
          
          lineItems: {
            create: cart.items.map((item) => {
              const lineTotal = item.quantity * item.variant.price;
              return {
                productId: item.variant.productId,
                productVariantId: item.variantId,
                productNameSnapshot: item.variant.product.title,
                productSlugSnapshot: item.variant.product.slug,
                skuSnapshot: item.variant.sku,
                quantity: item.quantity,
                unitPriceMinor: BigInt(item.variant.price),
                discountMinor: BigInt(0),
                taxMinor: BigInt(0), // Would calculate actual line item tax
                lineTotalMinor: BigInt(lineTotal),
                currency: "INR",
              };
            }),
          },
        },
      });

      // 6. Reserve Inventory
      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reservedQuantity: { increment: item.quantity } },
        });
      }

      // Deactivate Cart
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: "CONVERTED" },
      });

      return createdOrder;
    });

    // 7. Initialize Payment Provider Orchestration
    const paymentResult = await paymentOrchestrator.initiatePayment({
      orderId: order.id,
      userId: input.userId,
      idempotencyKey: uuidv4(), // Internal idempotency for payment creation
    });

    const finalResponse = {
      orderId: order.id,
      payment: paymentResult,
    };

    // Store idempotency response
    await idempotencyService.set(input.idempotencyKey, finalResponse);

    return finalResponse;
  }
}

export const checkoutService = new CheckoutService();
