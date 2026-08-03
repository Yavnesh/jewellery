import { auth } from "./auth";
import { UnauthorizedError } from "../errors/app-error";
import prisma from "@/utils/db";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError("Authentication is required");
  }

  // Verify session version against DB to ensure session was not revoked
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { sessionVersion: true, role: true, email: true }
  });

  if (!user) {
    throw new UnauthorizedError("Account no longer exists");
  }

  const tokenSessionVersion = (session.user as any).sessionVersion || 1;
  if (user.sessionVersion !== tokenSessionVersion) {
    throw new UnauthorizedError("Your session has expired. Please sign in again.");
  }

  return {
    id: session.user.id,
    email: user.email,
    role: user.role,
  };
}
