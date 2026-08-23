import prisma from "@/utils/db";

/**
 * Validates that if a subcategory is provided, it belongs to the given parent category.
 * @param categoryId Parent category ID
 * @param subcategoryId Subcategory ID (optional)
 * @returns Promise<boolean> True if valid, false otherwise
 */
export async function validateCategoryHierarchy(categoryId: string, subcategoryId?: string | null): Promise<boolean> {
  if (!categoryId) {
    return false;
  }

  // If no subcategory is provided, it's valid (e.g. Bracelets category has no subcategories)
  if (!subcategoryId) {
    return true;
  }

  const subcategory = await prisma.category.findUnique({
    where: { id: subcategoryId },
    select: { parentId: true }
  });

  if (!subcategory || subcategory.parentId !== categoryId) {
    return false;
  }

  return true;
}
