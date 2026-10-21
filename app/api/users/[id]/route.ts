import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import bcrypt from "bcryptjs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUserId = (session.user as any)?.id;
    const currentUserRole = ((session.user as any)?.role || "").toLowerCase();
    const isAdmin = currentUserRole === "admin" || currentUserRole === "superadmin";

    if (!isAdmin && currentUserId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("[GET /api/users/[id] Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserRole = ((session?.user as any)?.role || "").toLowerCase();
    const isAdmin = currentUserRole === "admin" || currentUserRole === "superadmin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { email, password, newPassword, role } = body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (email) updateData.email = email.toLowerCase().trim();
    if (role) updateData.role = role;
    const passToHash = newPassword || password;
    if (passToHash) {
      updateData.password = await bcrypt.hash(passToHash, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("[PUT /api/users/[id] Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserRole = ((session?.user as any)?.role || "").toLowerCase();
    const isAdmin = currentUserRole === "admin" || currentUserRole === "superadmin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin required" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.user.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("[DELETE /api/users/[id] Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
