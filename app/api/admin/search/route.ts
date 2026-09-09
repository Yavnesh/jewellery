import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth } from "@/lib/adminAuthHelper";

export async function GET(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length < 2) {
      return NextResponse.json({
        orders: [],
        products: [],
        customers: [],
        coupons: [],
      });
    }

    const [orders, products, users, coupons] = await Promise.all([
      prisma.customer_order.findMany({
        where: {
          OR: [
            { id: { contains: q } },
            { name: { contains: q } },
            { lastname: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            { shipments: { some: { trackingNumber: { contains: q } } } },
            { shipments: { some: { courier: { contains: q } } } },
          ],
        },
        take: 5,
        include: {
          shipments: { take: 1, orderBy: { createdAt: "desc" } },
        },
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { slug: { contains: q } },
            { manufacturer: { contains: q } },
          ],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          inStock: true,
          mainImage: true,
        },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q } },
            { profile: { firstName: { contains: q } } },
            { profile: { lastName: { contains: q } } },
          ],
        },
        take: 5,
        include: { profile: true },
      }),
      prisma.coupon.findMany({
        where: {
          code: { contains: q },
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      orders: orders.map((o) => {
        const tracking = o.shipments?.[0]?.trackingNumber;
        const courier = o.shipments?.[0]?.courier;
        const trackingStr = tracking ? ` • AWB: ${tracking} (${courier})` : "";
        return {
          id: o.id,
          title: `#${o.id.slice(0, 8)} — ${o.name} ${o.lastname}`,
          subtitle: `₹${o.total.toLocaleString()} • ${o.status}${trackingStr}`,
          url: `/admin/orders/${o.id}`,
        };
      }),
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: `₹${p.price.toLocaleString()} • ${p.inStock} in stock`,
        image: p.mainImage,
        url: `/admin/products/${p.id}`,
      })),
      customers: users.map((u) => ({
        id: u.id,
        title: `${u.profile?.firstName || ""} ${u.profile?.lastName || ""}`.trim() || u.email,
        subtitle: u.email,
        url: `/admin/customers/${u.id}`,
      })),
      coupons: coupons.map((c) => ({
        id: c.id,
        title: c.code,
        subtitle: `${c.discountType === "PERCENTAGE" ? `${c.value}% OFF` : `₹${c.value} OFF`} • Used: ${c.usedCount}/${c.usageLimit}`,
        url: `/admin/discounts`,
      })),
    });
  } catch (error: any) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: error.message || "Search failed" }, { status: 500 });
  }
}
