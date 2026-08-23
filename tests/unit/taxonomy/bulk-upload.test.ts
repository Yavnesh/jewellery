import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as bulkUploadHandler } from "@/app/api/bulk-upload/route";
import prisma from "@/utils/db";

vi.mock("@/utils/db", () => ({
  default: {
    category: {
      findMany: vi.fn().mockResolvedValue([
        { id: "c-rings", name: "Rings", slug: "rings" },
        { id: "c-earrings", name: "Earrings", slug: "earrings" },
        { id: "c-pendants", name: "Pendants", slug: "pendants" },
        { id: "c-loose", name: "White Loose Diamond", slug: "white-loose-diamond" },
        { id: "c-round", name: "white-loose-diamond-Round", slug: "white-loose-diamond-round", parentId: "c-loose" },
        { id: "c-placeholder", name: "REPLACE_WITH_CATEGORY_ID", slug: "legacy-placeholder" }
      ])
    },
    merchant: {
      findFirst: vi.fn().mockResolvedValue({ id: "m-1" }),
      create: vi.fn()
    },
    bulk_upload_batch: {
      create: vi.fn().mockResolvedValue({ id: "b-1" }),
      update: vi.fn()
    },
    bulk_upload_item: {
      create: vi.fn()
    },
    product: {
      create: vi.fn().mockResolvedValue({ id: "p-1" })
    },
    image: {
      create: vi.fn()
    },
    productOption: {
      create: vi.fn().mockResolvedValue({ id: "o-1" })
    },
    productOptionValue: {
      create: vi.fn().mockResolvedValue({ id: "ov-1" })
    },
    productVariant: {
      create: vi.fn().mockResolvedValue({ id: "v-1" })
    },
    variantOptionValue: {
      create: vi.fn()
    },
    $transaction: vi.fn(async (cb) => {
      return cb(prisma);
    })
  }
}));

import { parseCSV, classifyProduct } from "@/app/api/bulk-upload/route";

describe("Bulk Upload Helper Parsers", () => {
  it("parses multiline CSV strings containing nested quotes and commas correctly", () => {
    const csvContent = 
      `TITLE,DESCRIPTION,PRICE\n` +
      `"Natural Citrine Ring, Silver","Beautiful Ring\nGold Plated Finish",75.99`;
    
    const parsed = parseCSV(csvContent);
    expect(parsed.length).toBe(2);
    expect(parsed[1][0]).toBe("Natural Citrine Ring, Silver");
    expect(parsed[1][1]).toBe("Beautiful Ring\nGold Plated Finish");
    expect(parsed[1][2]).toBe("75.99");
  });

  it("classifies products dynamically based on title keywords matching taxonomy hierarchy rules", () => {
    const t1 = classifyProduct("Natural Tanzanite Diamond Halo Ring");
    expect(t1.categorySlug).toBe("rings");
    expect(t1.subcategorySlug).toBe("diamond-womens");

    const t2 = classifyProduct("Men Solitaire Wedding Diamond Ring");
    expect(t2.categorySlug).toBe("rings");
    expect(t2.subcategorySlug).toBe("diamond-mens");

    const t3 = classifyProduct("Natural Salt & Pepper Kite Diamond Loose");
    expect(t3.categorySlug).toBe("salt-and-pepper");
    expect(t3.subcategorySlug).toBe("salt-and-pepper-kite");
  });
});
