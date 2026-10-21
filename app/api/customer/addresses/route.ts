import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import prisma from "@/utils/db";

// Helper to get authenticated customer ID
async function getAuthUserId() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return null;
  return (session.user as any).id as string | undefined;
}

// GET: Fetch all addresses for the authenticated customer
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ addresses });
  } catch (error: any) {
    console.error("[Customer Addresses GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

// POST: Create a new address for the authenticated customer
export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      label,
      firstName,
      lastName,
      phone,
      line1,
      line2,
      city,
      state,
      postalCode,
      countryCode,
      isDefault,
    } = body;

    // Basic validation
    if (!firstName || !lastName || !phone || !line1 || !city || !state || !postalCode) {
      return NextResponse.json(
        { error: "Required address fields are missing" },
        { status: 400 }
      );
    }

    // If marked as default, unset any existing default address for this user
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Check if this is the user's first address; if so, make it default automatically
    const existingCount = await prisma.address.count({ where: { userId } });
    const shouldBeDefault = isDefault || existingCount === 0;

    const newAddress = await prisma.address.create({
      data: {
        userId,
        label: label?.trim() || null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        line1: line1.trim(),
        line2: line2?.trim() || null,
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        countryCode: (countryCode || "IN").toUpperCase().trim(),
        isDefault: shouldBeDefault,
      },
    });

    return NextResponse.json({ success: true, address: newAddress }, { status: 201 });
  } catch (error: any) {
    console.error("[Customer Addresses POST Error]:", error);
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
  }
}
