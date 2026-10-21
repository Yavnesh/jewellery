import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email");

    const currentUserEmail = (session.user.email || "").toLowerCase();
    const currentUserRole = ((session.user as any)?.role || "").toLowerCase();
    const isAdmin = currentUserRole === "admin" || currentUserRole === "superadmin";

    // Query by specific email
    if (emailParam) {
      const email = decodeURIComponent(emailParam).toLowerCase().trim();
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
    }

    // List all users (admin only)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin required" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("[GET /api/users Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserRole = ((session?.user as any)?.role || "").toLowerCase();
    const isAdmin = currentUserRole === "admin" || currentUserRole === "superadmin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin required" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role || "user",
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/users Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}
