import { NextResponse } from "next/server";
import prisma from "@/utils/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch category" },
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
    const { name } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: existingCategory.id },
      data: { name: name.trim() },
    });

    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
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
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if category has products
    const productsWithCategory = await prisma.product.findFirst({
      where: { categoryId: id },
    });

    if (productsWithCategory) {
      return NextResponse.json(
        { error: "Cannot delete category that has products" },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
