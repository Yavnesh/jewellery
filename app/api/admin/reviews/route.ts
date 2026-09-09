import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";

export async function GET(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search")?.trim() || "";

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { comment: { contains: search } },
        { user: { email: { contains: search } } },
        { product: { title: { contains: search } } },
      ];
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, title: true, mainImage: true } },
        user: { select: { id: true, email: true, profile: true } },
        order: { select: { id: true, total: true } },
      },
    });

    const statusCounts = {
      all: await prisma.review.count(),
      pending: await prisma.review.count({ where: { status: "PENDING" } }),
      approved: await prisma.review.count({ where: { status: "APPROVED" } }),
      rejected: await prisma.review.count({ where: { status: "REJECTED" } }),
    };

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        status: r.status,
        createdAt: r.createdAt,
        product: r.product,
        user: {
          id: r.user.id,
          email: r.user.email,
          name: `${r.user.profile?.firstName || ""} ${r.user.profile?.lastName || ""}`.trim() || r.user.email,
        },
        orderId: r.orderId,
      })),
      statusCounts,
    });
  } catch (error: any) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to load reviews" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { reviewId, status } = body;

    if (!reviewId || !status) {
      return NextResponse.json({ error: "Missing reviewId or status" }, { status: 400 });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
    });

    await recordAuditLog({
      actorId: (auth.user as any)?.id || "admin",
      action: "UPDATE_REVIEW_STATUS",
      entityType: "REVIEW",
      entityId: reviewId,
      newValue: { status },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    console.error("Update review status error:", error);
    return NextResponse.json({ error: error.message || "Failed to update review" }, { status: 500 });
  }
}
