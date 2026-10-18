import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import prisma from "@/utils/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    const currentUserId = (session.user as any).id;
    const currentUserEmail = session.user.email;
    const currentUserRole = ((session.user as any).role || "").toLowerCase();

    // Standard customers can ONLY see their own orders (by userId or registered email)
    // Non-superadmin / non-admin cannot view global orders here
    const isStoreAdmin = currentUserRole === "admin" || currentUserRole === "superadmin";

    const whereClause: any = isStoreAdmin
      ? {}
      : {
          OR: [
            ...(currentUserId ? [{ userId: currentUserId }] : []),
            ...(currentUserEmail ? [{ email: currentUserEmail }] : []),
          ],
        };

    const [orders, totalCount] = await Promise.all([
      prisma.customer_order.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: {
          dateTime: "desc",
        },
        include: {
          products: {
            include: {
              variant: true,
              product: {
                select: {
                  id: true,
                  title: true,
                  mainImage: true,
                  slug: true,
                },
              },
            },
          },
          shipments: true,
        },
      }),
      prisma.customer_order.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
