import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";

export async function GET(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const search = searchParams.get("search")?.trim() || "";

    const where: any = { role: "user" };
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { profile: { firstName: { contains: search } } },
        { profile: { lastName: { contains: search } } },
        { profile: { phone: { contains: search } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          profile: true,
          addresses: true,
          reviews: { select: { id: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate customer metrics (orders, spend)
    const userEmails = users.map((u) => u.email).filter(Boolean);
    const userOrders = await prisma.customer_order.findMany({
      where: { email: { in: userEmails } },
      select: { email: true, total: true, dateTime: true },
    });

    const enrichedUsers = users.map((u) => {
      const orders = userOrders.filter((o) => o.email.toLowerCase() === u.email.toLowerCase());
      const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const lastOrder = orders.sort((a, b) => new Date(b.dateTime || 0).getTime() - new Date(a.dateTime || 0).getTime())[0];

      return {
        id: u.id,
        email: u.email,
        firstName: u.profile?.firstName || "Customer",
        lastName: u.profile?.lastName || "",
        phone: u.profile?.phone || "—",
        orderCount: orders.length,
        totalSpent,
        lastOrderDate: lastOrder?.dateTime || null,
        reviewCount: u.reviews.length,
        addressCount: u.addresses.length,
        status: "Active",
      };
    });

    return NextResponse.json({
      customers: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Customers list error:", error);
    return NextResponse.json({ error: error.message || "Failed to load customers" }, { status: 500 });
  }
}
