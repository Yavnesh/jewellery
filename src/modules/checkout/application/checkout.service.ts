import prisma from "@/utils/db";
import { pricingService } from "./pricing.service";
import { paymentOrchestrator } from "@/src/modules/payments/application/payment-orchestrator.service";
import { idempotencyService } from "@/src/lib/idempotency";
import { couponService } from "./coupon.service";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export type CheckoutRequest = {
  cartId?: string;
  shippingAddressId?: string;
  billingAddressId?: string;
  userId?: string;
  idempotencyKey: string;
  couponCode?: string;
  shippingDetails?: {
    name: string;
    lastname: string;
    phone: string;
    email: string;
    company: string;
    adress: string;
    apartment: string;
    postalCode: string;
    city: string;
    state: string;
    country: string;
    orderNotice?: string;
  };
};

export class CheckoutService {
  async processCheckout(input: CheckoutRequest) {
    // 1. Idempotency Check
    const existingResult = await idempotencyService.get(input.idempotencyKey);
    if (existingResult) {
      return existingResult;
    }

    // 2. Load Cart
    let cart;
    if (input.cartId) {
      cart = await prisma.cart.findFirst({
        where: {
          id: input.cartId,
          userId: input.userId || undefined,
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
    } else if (input.userId) {
      cart = await prisma.cart.findFirst({
        where: {
          userId: input.userId,
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
    }

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty or not found");
    }

    // 3. Prepare Subtotal for Coupon validation
    let tempSubtotalMinor = 0;
    for (const item of cart.items) {
      tempSubtotalMinor += item.variant.price * item.quantity;
    }

    // 4. Validate Coupon code if provided
    let couponDiscountMinor = 0;
    let couponId: string | undefined;

    if (input.couponCode) {
      const validation = await couponService.validateCoupon(input.couponCode, tempSubtotalMinor, input.userId);
      if (!validation.isValid) {
        throw new Error(validation.error || "Invalid coupon code");
      }
      couponDiscountMinor = validation.discountAmountMinor;
      couponId = validation.couponId;
    }

    // 5. Load/Parse address details
    let firstName = "";
    let lastName = "";
    let email = "";
    let phone = "";
    let company = "";
    let addressLine1 = "";
    let addressLine2 = "";
    let city = "";
    let state = "";
    let country = "";
    let postalCode = "";
    let orderNotice = "";

    if (input.shippingAddressId) {
      const address = await prisma.address.findFirst({
        where: { id: input.shippingAddressId, userId: input.userId || undefined },
      });
      if (!address) throw new Error("Invalid shipping address ID");
      firstName = address.firstName;
      lastName = address.lastName;
      phone = address.phone;
      addressLine1 = address.line1;
      addressLine2 = address.line2 || "";
      city = address.city;
      state = address.state;
      country = address.countryCode;
      postalCode = address.postalCode;
    } else if (input.shippingDetails) {
      firstName = input.shippingDetails.name;
      lastName = input.shippingDetails.lastname;
      phone = input.shippingDetails.phone;
      email = input.shippingDetails.email;
      company = input.shippingDetails.company;
      addressLine1 = input.shippingDetails.adress;
      addressLine2 = input.shippingDetails.apartment || "";
      city = input.shippingDetails.city;
      state = input.shippingDetails.state;
      country = input.shippingDetails.country;
      postalCode = input.shippingDetails.postalCode;
      orderNotice = input.shippingDetails.orderNotice || "";
    } else {
      throw new Error("Either shippingAddressId or shippingDetails must be provided");
    }

    if (input.userId && !email) {
      const user = await prisma.user.findUnique({ where: { id: input.userId } });
      if (user) {
        email = user.email;
      }
    }

    if (!email) {
      throw new Error("Email address is required for checkout");
    }

    // 6. Prepare Pricing Input
    const pricingItems = cart.items.map((item) => {
      return {
        variantId: item.variantId,
        quantity: item.quantity,
        unitPriceMinor: item.variant.price,
        discountMinor: 0,
      };
    });

    // 7. Calculate Pricing with coupon discount and GST state mapping
    const pricing = await pricingService.calculate({
      items: pricingItems,
      currency: "INR",
      shippingState: state || undefined,
      couponDiscountMinor,
    });

    // 8. Create Order & apply coupon (Atomic Transaction)
    const order = await prisma.$transaction(async (tx) => {
      // Lock and Validate Inventory (FOR UPDATE)
      for (const item of cart.items) {
        const lockedVariants = await tx.$queryRaw<any[]>`
          SELECT id, stockQuantity, reservedQuantity, title FROM ProductVariant WHERE id = ${item.variantId} FOR UPDATE
        `;
        const lockedVariant = lockedVariants[0];
        if (!lockedVariant) {
          throw new Error("Product variant not found");
        }

        // Lock/Upsert Inventory Aggregate
        let inventory = await tx.inventory.findUnique({
          where: { variantId: item.variantId }
        });
        if (!inventory) {
          inventory = await tx.inventory.create({
            data: {
              variantId: item.variantId,
              onHand: lockedVariant.stockQuantity,
              reserved: 0,
              available: lockedVariant.stockQuantity,
            }
          });
        }

        const lockedInventories = await tx.$queryRaw<any[]>`
          SELECT id, available, reserved FROM Inventory WHERE id = ${inventory.id} FOR UPDATE
        `;
        const lockedInv = lockedInventories[0];

        if (lockedInv.available < item.quantity) {
          throw new Error(`Insufficient inventory for ${lockedVariant.title}`);
        }

        // Update variant stock & aggregates
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reservedQuantity: { increment: item.quantity } },
        });

        await tx.inventory.update({
          where: { id: lockedInv.id },
          data: {
            reserved: { increment: item.quantity },
            available: { decrement: item.quantity }
          }
        });

        await tx.inventoryEvent.create({
          data: {
            variantId: item.variantId,
            type: "RESERVATION",
            quantity: item.quantity,
            referenceId: "PENDING_ORDER",
            reason: "Checkout reservation initiated",
          },
        });
      }

      // Lock Coupon if applicable
      if (couponId) {
        const lockedCoupons = await tx.$queryRaw<any[]>`
          SELECT id, usedCount, usageLimit FROM Coupon WHERE id = ${couponId} FOR UPDATE
        `;
        const lockedCoupon = lockedCoupons[0];
        if (!lockedCoupon) {
          throw new Error("Coupon not found");
        }
        if (lockedCoupon.usedCount >= lockedCoupon.usageLimit) {
          throw new Error("Coupon usage limit has been reached");
        }
      }

      const createdOrder = await tx.customer_order.create({
        data: {
          userId: input.userId || null,
          cartId: cart.id,
          name: firstName,
          lastname: lastName,
          email: email,
          phone: phone,
          company: company,
          adress: addressLine1,
          apartment: addressLine2,
          city: city,
          country: country,
          postalCode: postalCode,
          orderNotice: orderNotice,
          total: pricing.total.amountMinor,
          status: "PENDING_PAYMENT",
          paymentStatus: PaymentStatus.PENDING,
          
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
                taxMinor: BigInt(0),
                lineTotalMinor: BigInt(lineTotal),
                currency: "INR",
              };
            }),
          },
          products: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              productId: item.variant.productId,
              quantity: item.quantity,
              priceAtPurchase: item.variant.price,
            })),
          },
          addressSnapshot: {
            create: {
              addressType: "SHIPPING",
              fullName: `${firstName} ${lastName}`,
              phone: phone,
              line1: addressLine1,
              line2: addressLine2 || null,
              city: city,
              state: state || "",
              postalCode: postalCode,
              country: country,
            }
          },
        },
      });

      // Update coupon application details
      if (couponId) {
        await tx.orderCoupon.create({
          data: {
            orderId: createdOrder.id,
            couponId: couponId,
            discount: couponDiscountMinor / 100,
          }
        });

        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } }
        });
      }

      // Update event referenceId with actual Order ID
      for (const item of cart.items) {
        await tx.inventoryEvent.updateMany({
          where: {
            variantId: item.variantId,
            referenceId: "PENDING_ORDER",
            type: "RESERVATION"
          },
          data: {
            referenceId: createdOrder.id
          }
        });
      }

      // Deactivate Cart
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: "CONVERTED" },
      });

      // Create Transactional Outbox Event for Notification
      await tx.outboxEvent.create({
        data: {
          eventType: "ORDER_CREATED",
          aggregateType: "ORDER",
          aggregateId: createdOrder.id,
          payload: {
            orderId: createdOrder.id,
          },
        },
      });

      return createdOrder;
    });

    // 10. Initialize Payment Provider Orchestration
    const paymentResult = await paymentOrchestrator.initiatePayment({
      orderId: order.id,
      userId: input.userId || "guest",
      idempotencyKey: `checkout_${order.id}`,
    });

    const finalResponse = {
      order: order,
      orderId: order.id,
      paymentIntent: paymentResult,
    };

    // Store idempotency response
    await idempotencyService.set(input.idempotencyKey, finalResponse);

    return finalResponse;
  }
}

export const checkoutService = new CheckoutService();
