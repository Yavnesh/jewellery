import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import prisma from "@/utils/db";

async function getAuthUserId() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return null;
  return (session.user as any).id as string | undefined;
}

// PUT: Update an existing address or set as default
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Address not found or unauthorized" }, { status: 404 });
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

    // If making this address default, clear isDefault on all other addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        ...(label !== undefined ? { label: label?.trim() || null } : {}),
        ...(firstName !== undefined ? { firstName: firstName.trim() } : {}),
        ...(lastName !== undefined ? { lastName: lastName.trim() } : {}),
        ...(phone !== undefined ? { phone: phone.trim() } : {}),
        ...(line1 !== undefined ? { line1: line1.trim() } : {}),
        ...(line2 !== undefined ? { line2: line2?.trim() || null } : {}),
        ...(city !== undefined ? { city: city.trim() } : {}),
        ...(state !== undefined ? { state: state.trim() } : {}),
        ...(postalCode !== undefined ? { postalCode: postalCode.trim() } : {}),
        ...(countryCode !== undefined ? { countryCode: countryCode.toUpperCase().trim() } : {}),
        ...(isDefault !== undefined ? { isDefault: Boolean(isDefault) } : {}),
      },
    });

    return NextResponse.json({ success: true, address: updated });
  } catch (error: any) {
    console.error("[Customer Address PUT Error]:", error);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

// DELETE: Remove an address
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Address not found or unauthorized" }, { status: 404 });
    }

    const wasDefault = existing.isDefault;

    await prisma.address.delete({
      where: { id },
    });

    // If the deleted address was default, set the latest remaining address as default
    if (wasDefault) {
      const nextDefault = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (nextDefault) {
        await prisma.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Address deleted successfully" });
  } catch (error: any) {
    console.error("[Customer Address DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
