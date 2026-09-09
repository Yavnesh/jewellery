import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";

export async function GET(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orderCoupons: {
          include: {
            order: { select: { id: true, total: true, dateTime: true } },
          },
        },
      },
    });

    const now = new Date();
    const enrichedCoupons = coupons.map((c) => {
      const isExpired = new Date(c.endDate) < now;
      const totalRevenueGenerated = c.orderCoupons.reduce((sum, oc) => sum + (oc.order?.total || 0), 0);
      const totalDiscountGiven = c.orderCoupons.reduce((sum, oc) => sum + (oc.discount || 0), 0);

      return {
        id: c.id,
        code: c.code,
        discountType: c.discountType,
        value: c.value,
        minOrderValue: c.minOrderValue,
        maxDiscount: c.maxDiscount,
        startDate: c.startDate,
        endDate: c.endDate,
        usageLimit: c.usageLimit,
        usedCount: c.usedCount,
        isExpired,
        status: isExpired ? "Expired" : c.usedCount >= c.usageLimit ? "Exhausted" : "Active",
        totalRevenueGenerated,
        totalDiscountGiven,
      };
    });

    return NextResponse.json({ coupons: enrichedCoupons });
  } catch (error: any) {
    console.error("Discounts fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to load coupons" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { code, discountType, value, minOrderValue, maxDiscount, startDate, endDate, usageLimit } = body;

    if (!code || !discountType || value === undefined || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required coupon fields" }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }

    const created = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discountType,
        value: parseFloat(value),
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        usageLimit: usageLimit ? parseInt(usageLimit) : 100,
      },
    });

    await recordAuditLog({
      actorId: (auth.user as any)?.id || "admin",
      action: "CREATE_COUPON",
      entityType: "COUPON",
      entityId: created.id,
      newValue: created,
    });

    return NextResponse.json({ success: true, coupon: created });
  } catch (error: any) {
    console.error("Create coupon error:", error);
    return NextResponse.json({ error: error.message || "Failed to create coupon" }, { status: 500 });
  }
}
