import prisma from "@/utils/db";

export type CouponValidationResult = {
  isValid: boolean;
  couponId?: string;
  discountAmountMinor: number;
  error?: string;
};

export class CouponService {
  async validateCoupon(code: string, subtotalMinor: number, userId?: string): Promise<CouponValidationResult> {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return { isValid: false, discountAmountMinor: 0, error: "Invalid coupon code" };
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return { isValid: false, discountAmountMinor: 0, error: "Coupon has expired or is not yet active" };
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return { isValid: false, discountAmountMinor: 0, error: "Coupon usage limit reached" };
    }

    if (subtotalMinor < coupon.minOrderValue * 100) {
      return { 
        isValid: false, 
        discountAmountMinor: 0, 
        error: `Minimum order value of INR ${coupon.minOrderValue} required to use this coupon` 
      };
    }

    // If userId is provided, we can optionally check if this user has already used this coupon
    if (userId) {
      const alreadyUsed = await prisma.orderCoupon.findFirst({
        where: {
          couponId: coupon.id,
          order: { userId: userId }
        }
      });
      if (alreadyUsed) {
        return { isValid: false, discountAmountMinor: 0, error: "You have already used this coupon code" };
      }
    }

    let discountMinor = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountMinor = Math.round(subtotalMinor * (coupon.value / 100));
      if (coupon.maxDiscount) {
        const maxDiscountMinor = coupon.maxDiscount * 100;
        discountMinor = Math.min(discountMinor, maxDiscountMinor);
      }
    } else if (coupon.discountType === "FIXED") {
      discountMinor = Math.round(coupon.value * 100);
      discountMinor = Math.min(discountMinor, subtotalMinor); // Cannot discount more than subtotal
    }

    return {
      isValid: true,
      couponId: coupon.id,
      discountAmountMinor: discountMinor
    };
  }

  async useCoupon(couponId: string, orderId: string, discountMinor: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 1. Log coupon application
      await tx.orderCoupon.create({
        data: {
          orderId,
          couponId,
          discount: discountMinor / 100, // Store in major units
        }
      });

      // 2. Increment coupon usage count
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } }
      });
    });
  }
}

export const couponService = new CouponService();
