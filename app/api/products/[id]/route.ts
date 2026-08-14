import { NextResponse } from "next/server";
import prisma from "@/utils/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      merchantId,
      slug,
      title,
      mainImage,
      price,
      rating,
      description,
      manufacturer,
      categoryId,
      inStock,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        merchantId,
        title,
        mainImage,
        slug,
        price: price ? Number(price) : undefined,
        rating: rating ? Number(rating) : undefined,
        description,
        manufacturer,
        categoryId,
        inStock: inStock ? Number(inStock) : undefined,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Check for related records in order_product table
    const relatedOrderProductItems = await prisma.customer_order_product.findMany({
      where: { productId: id },
    });
    
    if (relatedOrderProductItems.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete product because of foreign key constraint" },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
