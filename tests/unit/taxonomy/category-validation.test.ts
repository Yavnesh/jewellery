import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateCategoryHierarchy } from "@/lib/validation/product.validation";
import prisma from "@/utils/db";

vi.mock("@/utils/db", () => ({
  default: {
    category: {
      findUnique: vi.fn().mockImplementation((args) => {
        const id = args.where.id;
        if (id === "sub-valid") {
          return Promise.resolve({ id: "sub-valid", parentId: "parent-1" });
        }
        if (id === "sub-invalid") {
          return Promise.resolve({ id: "sub-invalid", parentId: "parent-2" });
        }
        return Promise.resolve(null);
      })
    }
  }
}));

describe("Category-Subcategory Hierarchy Integrity Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when no subcategory is provided", async () => {
    const isValid = await validateCategoryHierarchy("parent-1", null);
    expect(isValid).toBe(true);
  });

  it("returns true when subcategory belongs to correct parent category", async () => {
    const isValid = await validateCategoryHierarchy("parent-1", "sub-valid");
    expect(isValid).toBe(true);
  });

  it("returns false when subcategory does not belong to specified parent category", async () => {
    const isValid = await validateCategoryHierarchy("parent-1", "sub-invalid");
    expect(isValid).toBe(false);
  });

  it("returns false when parent category ID is missing", async () => {
    const isValid = await validateCategoryHierarchy("", "sub-valid");
    expect(isValid).toBe(false);
  });
});
