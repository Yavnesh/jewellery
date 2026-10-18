import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }
  
  const role = ((session.user as any)?.role || "").toLowerCase();
  const email = (session.user?.email || "").toLowerCase();
  const isSuperAdminEmail = email === "admin@vamikajewels.com" || email === "admin@vamiexports.com";

  if (role !== "admin" && role !== "superadmin" && !isSuperAdminEmail) {
    redirect("/");
  }
  
  return session;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return false;
  const role = ((session.user as any)?.role || "").toLowerCase();
  const email = (session.user?.email || "").toLowerCase();
  const isSuperAdminEmail = email === "admin@vamikajewels.com" || email === "admin@vamiexports.com";
  return role === "admin" || role === "superadmin" || isSuperAdminEmail;
}

