import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email: rawEmail } = await params;
    const email = decodeURIComponent(rawEmail).toLowerCase().trim();

    const currentUserEmail = (session.user.email || "").toLowerCase();
    const currentUserRole = ((session.user as any)?.role || "").toLowerCase();
    const isAdmin = currentUserRole === "admin" || currentUserRole === "superadmin";

    // Regular users can only query their own user record; admins can query any
    if (!isAdmin && currentUserEmail !== email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
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
    console.error("[GET /api/users/email/[email] Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch user" }, { status: 500 });
  }
}
