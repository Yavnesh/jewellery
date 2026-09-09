import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth } from "@/lib/adminAuthHelper";

export async function GET(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    // Date range calculations
    const now = new Date();
    let startDate = new Date();
    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "90d") {
      startDate.setDate(now.getDate() - 90);
    } else if (range === "12m") {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      // default 30d
      startDate.setDate(now.getDate() - 30);
    }

    // Parallel aggregate queries from DB
    const [
      totalOrdersCount,
      periodOrders,
      totalCustomersCount,
      newCustomersPeriod,
      totalProductsCount,
      lowStockProducts,
      recentOrders,
      reviewsPendingCount,
      returnsPendingCount,
      topOrderedProducts,
      recentAuditLogs,
      awaitingShipmentCount,
      inTransitCount,
      deliveredTodayCount,
      exceptionsCount,
    ] = await Promise.all([
      prisma.customer_order.count(),
      prisma.customer_order.findMany({
        where: { dateTime: { gte: startDate } },
        select: { total: true, status: true, paymentStatus: true, dateTime: true, country: true },
      }),
      prisma.user.count({ where: { role: "user" } }),
      prisma.user.count({
        where: {
          role: "user",
          profile: { createdAt: { gte: startDate } },
        },
      }),
      prisma.product.count(),
      prisma.product.findMany({
        where: { inStock: { lte: 5 } },
        take: 6,
        select: { id: true, title: true, inStock: true, price: true, mainImage: true },
      }),
      prisma.customer_order.findMany({
        take: 8,
        orderBy: { dateTime: "desc" },
        include: {
          shipments: { take: 1, orderBy: { createdAt: "desc" } },
          payments: { take: 1, orderBy: { createdAt: "desc" } },
        },
      }),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.orderReturn.count({ where: { status: { in: ["REQUESTED", "PENDING", "RECEIVED"] } } }),
      prisma.customer_order_product.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
      // Shipping KPI aggregates
      prisma.customer_order.count({
        where: {
          status: { in: ["processing", "PAID", "FULFILLMENT_PENDING"] },
          shipments: { none: {} },
        },
      }),
      prisma.orderShipment.count({
        where: { status: { in: ["IN_TRANSIT", "PICKED_UP", "CUSTOMS_CLEARANCE", "OUT_FOR_DELIVERY"] } },
      }),
      prisma.orderShipment.count({
        where: {
          status: "DELIVERED",
          deliveredAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.orderShipment.count({
        where: { status: { in: ["EXCEPTION", "CUSTOMS_HOLD", "RETURNED"] } },
      }),
    ]);

    // Compute KPIs
    const periodRevenue = periodOrders.reduce((acc, order) => acc + (order.total || 0), 0);
    const completedOrders = periodOrders.filter((o) => o.status === "delivered" || o.status === "PAID" || o.paymentStatus === "SUCCEEDED");
    const avgOrderValue = periodOrders.length > 0 ? Math.round(periodRevenue / periodOrders.length) : 0;
    const refundsCount = periodOrders.filter((o) => o.paymentStatus === "REFUNDED" || o.status === "REFUNDED").length;
    const refundAmount = periodOrders.filter((o) => o.paymentStatus === "REFUNDED").reduce((sum, o) => sum + (o.total || 0), 0);

    // Group sales by day/date for revenue chart
    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().split("T")[0];
      dailyMap[key] = { revenue: 0, orders: 0 };
    }

    periodOrders.forEach((o) => {
      if (o.dateTime) {
        const key = new Date(o.dateTime).toISOString().split("T")[0];
        if (dailyMap[key]) {
          dailyMap[key].revenue += o.total || 0;
          dailyMap[key].orders += 1;
        }
      }
    });

    const chartData = Object.entries(dailyMap).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      revenue: data.revenue,
      orders: data.orders,
    }));

    // Top products enrichment
    const productIds = topOrderedProducts.map((p) => p.productId).filter(Boolean) as string[];
    const productsDetails = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, price: true, mainImage: true, inStock: true },
    });

    const topProductsWithDetails = topOrderedProducts.map((top) => {
      const details = productsDetails.find((p) => p.id === top.productId);
      const units = top._sum.quantity || 0;
      return {
        id: top.productId,
        title: details?.title || "Unknown Product",
        price: details?.price || 0,
        mainImage: details?.mainImage || "/placeholder.jpg",
        inStock: details?.inStock || 0,
        unitsSold: units,
        revenue: (details?.price || 0) * units,
      };
    });

    return NextResponse.json({
      kpis: {
        revenue: periodRevenue,
        orders: periodOrders.length,
        aov: avgOrderValue,
        totalCustomers: totalCustomersCount,
        newCustomers: newCustomersPeriod,
        totalProducts: totalProductsCount,
        refundAmount: refundAmount,
        refundsCount: refundsCount,
      },
      chartData,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        customer: `${o.name} ${o.lastname}`.trim(),
        email: o.email,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        dateTime: o.dateTime,
        country: o.country,
        city: o.city,
      })),
      topProducts: topProductsWithDetails,
      lowStockProducts,
      alerts: {
        pendingReviews: reviewsPendingCount,
        pendingReturns: returnsPendingCount,
        lowStockCount: lowStockProducts.length,
      },
      shippingMetrics: {
        awaitingShipment: awaitingShipmentCount,
        inTransit: inTransitCount,
        deliveredToday: deliveredTodayCount,
        exceptions: exceptionsCount,
      },
      recentAuditLogs,
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: error.message || "Failed to load dashboard data" }, { status: 500 });
  }
}
