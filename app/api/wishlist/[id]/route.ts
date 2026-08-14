import prisma from "@/utils/db";
import { NextResponse } from "next/server";

// GET /api/wishlist/[id] - Get wishlist items for user ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: id },
      include: {
        product: true,
      },
    });
    return NextResponse.json(wishlist);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/wishlist/[id] - Add item to wishlist for user ID
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // userId
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    // Check if it already exists to prevent duplicate
    const existing = await prisma.wishlist.findFirst({
      where: {
        userId: id,
        productId,
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const newItem = await prisma.wishlist.create({
      data: {
        userId: id,
        productId,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(newItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/wishlist/[id] - Remove item from wishlist for user ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // userId
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId query parameter is required" }, { status: 400 });
    }

    await prisma.wishlist.deleteMany({
      where: {
        userId: id,
        productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
