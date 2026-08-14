import { NextResponse } from "next/server";
import prisma from "@/utils/db";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({});
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}
