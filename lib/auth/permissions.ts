export enum UserRole {
  CUSTOMER = "user",
  ADMIN = "admin",
  SUPPORT = "support",
  CATALOG_MANAGER = "catalog_manager"
}

export const permissions = {
  "product:create": [UserRole.ADMIN, UserRole.CATALOG_MANAGER],
  "product:update": [UserRole.ADMIN, UserRole.CATALOG_MANAGER],
  "product:delete": [UserRole.ADMIN],
  "order:read:any": [UserRole.ADMIN, UserRole.SUPPORT],
  "order:update": [UserRole.ADMIN, UserRole.SUPPORT],
} as const;
