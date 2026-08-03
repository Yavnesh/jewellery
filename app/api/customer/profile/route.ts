import { requireUser } from "@/lib/auth/require-user";
import prisma from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireUser();
    
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: user.id }
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
