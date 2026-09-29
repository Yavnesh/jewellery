import prisma from "../utils/db";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

async function exportProductsToExcel() {
  console.log("Fetching all products from database with relations...");
  const startTime = Date.now();

  const products = await prisma.product.findMany({
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      merchant: {
        select: {
          id: true,
          name: true,
        },
      },
      variants: {
        select: {
          id: true,
          sku: true,
          price: true,
          compareAtPrice: true,
          stockQuantity: true,
          weight: true,
          status: true,
        },
      },
      options: {
        include: {
          values: {
            orderBy: { position: "asc" },
          },
        },
      },
    },
    orderBy: {
      title: "asc",
    },
  });

  console.log(`Fetched ${products.length} products in ${(Date.now() - startTime) / 1000}s`);

  // Sheet 1: Master Products Data
  const productsRows = products.map((p, idx) => {
    // Parse additional images if JSON
    let extraImages = p.images || "";
    try {
      if (p.images && p.images.startsWith("[")) {
        const parsed = JSON.parse(p.images);
        if (Array.isArray(parsed)) {
          extraImages = parsed.join(", ");
        }
      }
    } catch {
      // keep raw string
    }

    // Extract options summary
    const optionsSummary = p.options
      .map((opt) => `${opt.name}: [${opt.values.map((v) => v.value).join(", ")}]`)
      .join(" | ");

    // Primary SKU from first variant or generate standard
    const primarySku = p.variants[0]?.sku || `VMK-${p.slug.slice(0, 12).toUpperCase()}`;

    return {
      "No": idx + 1,
      "Product ID": p.id,
      "Title / Product Name": p.title,
      "SKU": primarySku,
      "Slug / URL Key": p.slug,
      "Category Name": p.category?.name || "Uncategorized",
      "Category Slug": p.category?.slug || "",
      "Category ID": p.categoryId,
      "Price (₹ / $)": p.price,
      "Original / Compare Price": p.originalPrice || p.variants[0]?.compareAtPrice || "",
      "Stock Quantity": p.inStock,
      "Main Image URL": p.mainImage,
      "Additional Images": extraImages,
      "Metal Type": p.metalType || "",
      "Purity / Clarity": p.purity || "",
      "Weight (grams/cts)": p.weight || "",
      "Collection": p.collection || "",
      "Occasion": p.occasion || "",
      "Gender": p.gender || "",
      "Features": p.features || "",
      "Description": p.description || "",
      "Manufacturer / Brand": p.manufacturer || "Vamika Luxe",
      "Merchant Name": p.merchant?.name || "Vamika Store",
      "Featured (Yes/No)": p.featured ? "Yes" : "No",
      "New Arrival (Yes/No)": p.isNewArrival ? "Yes" : "No",
      "Bestseller (Yes/No)": p.isBestseller ? "Yes" : "No",
      "Total Variants": p.variants.length,
      "Options Configured": optionsSummary,
    };
  });

  // Sheet 2: Variants Detailed Breakdown
  const variantRows: any[] = [];
  let variantIndex = 1;

  for (const p of products) {
    if (p.variants.length === 0) {
      variantRows.push({
        "No": variantIndex++,
        "Product ID": p.id,
        "Product Title": p.title,
        "Variant ID": "",
        "Variant SKU": `VMK-${p.slug.slice(0, 12).toUpperCase()}`,
        "Variant Title / Option": "Default",
        "Price": p.price,
        "Compare At Price": p.originalPrice || "",
        "Stock Quantity": p.inStock,
        "Weight": p.weight || "",
        "Status": "ACTIVE",
      });
    } else {
      for (const v of p.variants) {
        variantRows.push({
          "No": variantIndex++,
          "Product ID": p.id,
          "Product Title": p.title,
          "Variant ID": v.id,
          "Variant SKU": v.sku,
          "Variant Title / Option": v.sku,
          "Price": v.price,
          "Compare At Price": v.compareAtPrice || "",
          "Stock Quantity": v.stockQuantity,
          "Weight": v.weight || "",
          "Status": v.status,
        });
      }
    }
  }

  // Sheet 3: Reference Categories & Valid Slugs
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const categoryRows = categories.map((c, i) => ({
    "No": i + 1,
    "Category ID": c.id,
    "Category Name": c.name,
    "Category Slug": c.slug,
    "Parent ID": c.parentId || "Root",
  }));

  // Create Workbook
  const workbook = XLSX.utils.book_new();

  const productSheet = XLSX.utils.json_to_sheet(productsRows);
  const variantSheet = XLSX.utils.json_to_sheet(variantRows);
  const categorySheet = XLSX.utils.json_to_sheet(categoryRows);

  // Auto-fit column widths
  const setCols = (sheet: any, data: any[]) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    sheet["!cols"] = headers.map((key) => {
      const maxLen = Math.max(
        key.length,
        ...data.slice(0, 50).map((row) => (row[key] ? String(row[key]).length : 0))
      );
      return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
    });
  };

  setCols(productSheet, productsRows);
  setCols(variantSheet, variantRows);
  setCols(categorySheet, categoryRows);

  XLSX.utils.book_append_sheet(workbook, productSheet, "Products (All 3854)");
  XLSX.utils.book_append_sheet(workbook, variantSheet, "Product Variants");
  XLSX.utils.book_append_sheet(workbook, categorySheet, "Categories Reference");

  // Output file paths
  const outputDir = path.join(process.cwd(), "public", "exports");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFilePath = path.join(outputDir, "Vamika_Jewels_Products_Database.xlsx");
  const projectRootFilePath = path.join(process.cwd(), "Vamika_Jewels_Products_Database.xlsx");

  XLSX.writeFile(workbook, outputFilePath);
  XLSX.writeFile(workbook, projectRootFilePath);

  console.log(`Excel file successfully created!`);
  console.log(`- Project Root: ${projectRootFilePath}`);
  console.log(`- Public URL path: /exports/Vamika_Jewels_Products_Database.xlsx`);
}

exportProductsToExcel()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Export error:", err);
    process.exit(1);
  });
