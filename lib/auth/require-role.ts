import { requireUser } from "./require-user";
import { ForbiddenError } from "../errors/app-error";
import { UserRole } from "./permissions";

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new ForbiddenError("You do not have permission to perform this action");
  }

  return user;
}
