import { NextResponse } from "next/server";
import prisma from "@/utils/db";

// State-machine based robust CSV parser that handles nested quotes, newlines, and commas
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i++;
      }
      row.push(cell.trim());
      // Skip empty line split boundaries
      if (row.some(c => c !== "")) {
        result.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim());
    if (row.some(c => c !== "")) {
      result.push(row);
    }
  }
  return result;
}

// Map product titles to category/subcategory slugs based on taxonomy keywords
export function classifyProduct(title: string): { categorySlug: string; subcategorySlug?: string } {
  const t = title.toLowerCase();
  
  if (t.includes("salt & pepper") || t.includes("salt and pepper")) {
    const shapes = ["round", "marqueue", "oval", "kite", "shield", "emerald", "hexagon"];
    for (const shape of shapes) {
      if (t.includes(shape) || t.includes(shape.replace("marqueue", "marquee"))) {
        return { categorySlug: "salt-and-pepper", subcategorySlug: `salt-and-pepper-${shape}` };
      }
    }
    return { categorySlug: "salt-and-pepper" };
  }

  if (t.includes("white loose diamond")) {
    const shapes = ["round", "marqueue", "oval", "kite", "shield", "emerald", "hexagon"];
    for (const shape of shapes) {
      if (t.includes(shape) || t.includes(t.replace("marqueue", "marquee"))) {
        return { categorySlug: "white-loose-diamond", subcategorySlug: `white-loose-diamond-round` };
      }
    }
    return { categorySlug: "white-loose-diamond" };
  }

  if (t.includes("ring")) {
    if (t.includes("men") || t.includes("mens")) {
      return { categorySlug: "rings", subcategorySlug: "diamond-mens" };
    }
    if (t.includes("engagement") || t.includes("wedding")) {
      return { categorySlug: "rings", subcategorySlug: "engagement" };
    }
    return { categorySlug: "rings", subcategorySlug: "diamond-womens" };
  }

  if (t.includes("earring")) {
    if (t.includes("dangle") || t.includes("hanging") || t.includes("drop")) {
      return { categorySlug: "earrings", subcategorySlug: "hanging" };
    }
    return { categorySlug: "earrings", subcategorySlug: "tops" };
  }

  if (t.includes("pendant")) {
    if (t.includes("set") || t.includes("earring")) {
      return { categorySlug: "pendants", subcategorySlug: "sets" };
    }
    return { categorySlug: "pendants", subcategorySlug: "single" };
  }

  if (t.includes("bangle")) {
    return { categorySlug: "bangles" };
  }

  if (t.includes("bracelet")) {
    return { categorySlug: "bracelets" };
  }

  if (t.includes("necklace")) {
    return { categorySlug: "necklace" };
  }

  if (t.includes("broch") || t.includes("brooch") || t.includes("broches")) {
    return { categorySlug: "broches" };
  }

  if (t.includes("charm")) {
    return { categorySlug: "charms" };
  }

  // Default fallback category slug
  return { categorySlug: "legacy-placeholder" };
}

export async function GET() {
  try {
    const batches = await prisma.bulk_upload_batch.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(batches);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded" }, { status: 400 });
    }

    const csvText = await file.text();
    const parsedData = parseCSV(csvText);

    if (parsedData.length < 2) {
      return NextResponse.json({ error: "CSV file is empty or does not contain rows" }, { status: 400 });
    }

    // Extract headers and map indices
    const headers = parsedData[0].map(h => h.toUpperCase());
    const getIndex = (headerName: string) => headers.indexOf(headerName);

    const titleIdx = getIndex("TITLE");
    const descIdx = getIndex("DESCRIPTION");
    const priceIdx = getIndex("PRICE");
    const qtyIdx = getIndex("QUANTITY");
    const tagsIdx = getIndex("TAGS");
    const materialsIdx = getIndex("MATERIALS");
    const skuIdx = getIndex("SKU");
    const manufacturerIdx = getIndex("MANUFACTURER");
    const var1TypeIdx = getIndex("VARIATION 1 TYPE");
    const var1NameIdx = getIndex("VARIATION 1 NAME");
    const var1ValsIdx = getIndex("VARIATION 1 VALUES");
    const var2TypeIdx = getIndex("VARIATION 2 TYPE");
    const var2NameIdx = getIndex("VARIATION 2 NAME");
    const var2ValsIdx = getIndex("VARIATION 2 VALUES");

    const categories = await prisma.category.findMany();
    const catMapBySlug = new Map(categories.map(c => [c.slug, c]));

    // Find default dummy merchant or create one
    let merchant = await prisma.merchant.findFirst();
    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: {
          name: "Vamika Store",
          email: "vamika@jewels.com",
          status: "APPROVED"
        }
      });
    }

    // Create bulk upload batch tracker
    const batch = await prisma.bulk_upload_batch.create({
      data: {
        fileName: file.name,
        itemCount: parsedData.length - 1,
        status: "PENDING"
      }
    });

    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process rows sequentially to prevent transactional race conditions on identical products/variants
    for (let r = 1; r < parsedData.length; r++) {
      const row = parsedData[r];
      if (row.length < 2) continue;

      const title = row[titleIdx] || "";
      const description = row[descIdx] || "";
      const rawPrice = parseFloat(row[priceIdx] || "0");
      const price = Math.round(rawPrice * 100); 
      const quantity = parseInt(row[qtyIdx] || "0");
      const tags = row[tagsIdx] || "";
      const materials = row[materialsIdx] || "";
      const sku = row[skuIdx] || `K-MIG-${batch.id.substring(0, 5)}-${r}`;
      const manufacturer = manufacturerIdx !== -1 && row[manufacturerIdx] ? row[manufacturerIdx] : "Vamika Jewels";

      // Retrieve image list from columns
      const imageList: string[] = [];
      for (let imgNum = 1; imgNum <= 10; imgNum++) {
        const imgIdx = getIndex(`IMAGE${imgNum}`);
        if (imgIdx !== -1 && row[imgIdx]) {
          imageList.push(row[imgIdx]);
        }
      }
      const mainImage = imageList[0] || "/product_placeholder.jpg";

      // Classify category and subcategory
      const { categorySlug, subcategorySlug } = classifyProduct(title);
      const targetSlug = subcategorySlug || categorySlug;
      const targetCategory = catMapBySlug.get(targetSlug) || catMapBySlug.get("legacy-placeholder");

      if (!targetCategory) {
        failed++;
        errors.push(`Row ${r}: Category ${targetSlug} not found`);
        continue;
      }

      try {
        const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${r}`;
        let isUpdate = false;

        // Deduplication: Search for existing variant by SKU
        const existingVariant = await prisma.productVariant.findFirst({
          where: {
            OR: [
              { sku: sku },
              { sku: { startsWith: `${sku}-` } }
            ]
          }
        });

        if (existingVariant) {
          // Skip already processed products to support resuming bulk uploads
          successful++;
          continue;
        }

        // Create product record
        const product = await prisma.product.create({
          data: {
            title,
            slug,
            description,
            price,
            mainImage,
            inStock: quantity,
            categoryId: targetCategory.id,
            merchantId: merchant.id,
            features: tags,
            metalType: materials.split(",")[0] || null,
            originalPrice: price,
            rating: 5,
            manufacturer
          }
        });

        // Save secondary images to Image table
        for (const img of imageList) {
          await prisma.image.create({
            data: {
              productID: product.id,
              image: img
            }
          });
        }

        // Handle variations if any
        const var1Name = row[var1NameIdx];
        const var1Vals = row[var1ValsIdx];

        if (var1Name && var1Vals) {
          // Create product option
          const option = await prisma.productOption.create({
            data: {
              productId: product.id,
              name: var1Name
            }
          });

          // Split option values
          const values = var1Vals.split(",").map(v => v.trim()).filter(Boolean);
          for (let vIdx = 0; vIdx < values.length; vIdx++) {
            const val = values[vIdx];
            const optionValue = await prisma.productOptionValue.create({
              data: {
                optionId: option.id,
                value: val,
                position: vIdx
              }
            });

            // Create variant for each option value
            const variantSku = `${sku}-${val.replace(/\s+/g, "-")}`;
            const variant = await prisma.productVariant.create({
              data: {
                productId: product.id,
                sku: variantSku,
                price,
                stockQuantity: quantity,
                title: `${title} - ${val}`,
                position: vIdx
              }
            });

            // Map variant to value
            await prisma.variantOptionValue.create({
              data: {
                variantId: variant.id,
                optionValueId: optionValue.id
              }
            });
          }
        } else {
          // Default variant if no options specified
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku,
              price,
              stockQuantity: quantity,
              title: `${title} - Default`
            }
          });
        }

        // Add to audit items
        await prisma.bulk_upload_item.create({
          data: {
            batchId: batch.id,
            productId: product.id,
            title,
            slug,
            price,
            inStock: quantity,
            categoryId: targetCategory.id,
            mainImage,
            status: isUpdate ? "UPDATED" : "CREATED"
          }
        });

        successful++;
      } catch (err: any) {
        failed++;
        errors.push(`Row ${r}: ${err.message}`);
        await prisma.bulk_upload_item.create({
          data: {
            batchId: batch.id,
            title,
            slug: `failed-${r}`,
            price,
            inStock: quantity,
            categoryId: targetCategory.id,
            status: "ERROR",
            error: err.message
          }
        });
      }
    }

    // Update batch status
    await prisma.bulk_upload_batch.update({
      where: { id: batch.id },
      data: {
        status: failed === 0 ? "COMPLETED" : "FAILED",
        errorCount: failed,
        itemCount: successful
      }
    });

    return NextResponse.json({
      success: true,
      message: `Bulk upload completed: ${successful} successful, ${failed} failed.`,
      details: {
        processed: successful + failed,
        successful,
        failed,
        errors
      }
    });

  } catch (error: any) {
    console.error("Bulk Upload API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
