const XLSX = require("xlsx");
const { parse } = require("csv-parse/sync");

// Parse Excel or CSV buffer to rows
async function parseCsvBufferToRows(buffer) {
  // Try parsing as Excel first
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    if (rows && rows.length > 0) {
      return rows;
    }
  } catch (excelError) {
    console.log("Not a valid Excel file, trying CSV...", excelError.message);
  }

  // Fallback to CSV
  const text = buffer.toString("utf-8");
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
}

// Validate a single row
function validateRow(row) {
  const errs = [];
  const clean = {};

  // Group columns from sheet
  const product_slug = String(row.product_slug ?? "").trim();
  const product_title = String(row.product_title ?? "").trim();
  const main_image = row.main_image ? String(row.main_image).trim() : null;
  const product_price = Number(row.product_price ?? 0);
  const rating = Number(row.rating ?? 0);
  const description = row.description ? String(row.description).trim() : "";
  const manufacturer = row.manufacturer ? String(row.manufacturer).trim() : "";
  const product_stock = Number(row.product_stock ?? 0);
  const category_id = String(row.category_id ?? "").trim();
  
  // Validation for base product (only if slug and title are provided, meaning it's a new product)
  if (product_title || product_slug) {
    if (!product_title) errs.push("product_title is required");
    if (!product_slug) errs.push("product_slug is required");
    if (!category_id) errs.push("category_id (name or UUID) is required");
  }

  // Variant columns validation
  const variant_sku = String(row.variant_sku ?? "").trim();
  const variant_price = Number(row.variant_price ?? 0);
  const variant_stock_quantity = Number(row.variant_stock_quantity ?? 0);

  if (!variant_sku) {
    errs.push("variant_sku is required");
  }

  if (errs.length) {
    return { ok: false, error: errs.join(", ") };
  }

  // Clean data structure
  clean.product_slug = product_slug;
  clean.product_title = product_title;
  clean.main_image = main_image;
  clean.product_price = Math.round(product_price * 100) / 100;
  clean.rating = rating;
  clean.description = description;
  clean.manufacturer = manufacturer;
  clean.product_stock = Math.floor(product_stock);
  clean.category_id = category_id;
  
  clean.occasion = row.occasion ? String(row.occasion).trim() : null;
  clean.collection = row.collection ? String(row.collection).trim() : null;
  clean.images = row.images ? String(row.images).trim() : null;
  clean.metal_type = row.metal_type ? String(row.metal_type).trim() : null;
  clean.purity = row.purity ? String(row.purity).trim() : null;
  clean.weight = row.weight ? Number(row.weight) : null;
  clean.features = row.features ? String(row.features).trim() : null;
  clean.gender = row.gender ? String(row.gender).trim() : null;
  clean.original_price = row.original_price ? Number(row.original_price) : null;
  clean.merchant_id = row.merchant_id ? String(row.merchant_id).trim() : null;
  
  clean.featured = String(row.featured).toLowerCase() === "true" || row.featured === true;
  clean.is_new_arrival = String(row.is_new_arrival).toLowerCase() === "true" || row.is_new_arrival === true;
  clean.is_bestseller = String(row.is_bestseller).toLowerCase() === "true" || row.is_bestseller === true;
  clean.sort_priority = Number(row.sort_priority ?? 0);

  // Variant fields
  clean.variant_sku = variant_sku;
  clean.variant_barcode = row.variant_barcode ? String(row.variant_barcode).trim() : null;
  clean.variant_title = row.variant_title ? String(row.variant_title).trim() : null;
  clean.variant_position = Number(row.variant_position ?? 1);
  clean.variant_price = Math.round(variant_price);
  clean.variant_compare_at_price = row.variant_compare_at_price ? Math.round(Number(row.variant_compare_at_price)) : null;
  clean.variant_weight = row.variant_weight ? Number(row.variant_weight) : null;
  clean.variant_stock_quantity = Math.floor(variant_stock_quantity);
  clean.variant_reserved_quantity = Math.floor(Number(row.variant_reserved_quantity ?? 0));
  clean.variant_status = row.variant_status ? String(row.variant_status).trim().toUpperCase() : "ACTIVE";

  // Option fields
  clean.option_1_name = row.option_1_name ? String(row.option_1_name).trim() : null;
  clean.option_1_value = row.option_1_value ? String(row.option_1_value).trim() : null;
  clean.option_1_position = Number(row.option_1_position ?? 1);

  clean.option_2_name = row.option_2_name ? String(row.option_2_name).trim() : null;
  clean.option_2_value = row.option_2_value ? String(row.option_2_value).trim() : null;
  clean.option_2_position = Number(row.option_2_position ?? 1);

  clean.option_3_name = row.option_3_name ? String(row.option_3_name).trim() : null;
  clean.option_3_value = row.option_3_value ? String(row.option_3_value).trim() : null;
  clean.option_3_position = Number(row.option_3_position ?? 1);

  return { ok: true, data: clean };
}

// Helper to compute batch status
function computeBatchStatus(successCount, errorCount) {
  if (successCount > 0 && errorCount === 0) return "COMPLETED";
  if (successCount > 0 && errorCount > 0) return "PARTIAL";
  if (successCount === 0 && errorCount > 0) return "FAILED";
  return "PENDING";
}

// Bulk insert products, options, values, variants, and variant options mapping
async function createBatchWithItems(tx, batchId, validRows, errorRows) {
  // 1. Group rows by product_slug to identify all variants belonging to a single product
  const productGroups = {};
  
  // Track last seen slug for variant rows that leave the product fields empty
  let lastSlug = null;
  
  for (const row of validRows) {
    let slug = row.product_slug;
    if (!slug && lastSlug) {
      slug = lastSlug;
    }
    
    if (slug) {
      if (!productGroups[slug]) {
        productGroups[slug] = {
          variants: [],
          base: null
        };
      }
      productGroups[slug].variants.push(row);
      
      // If the row contains base product info, store it as the base product template
      if (row.product_title && row.category_id) {
        productGroups[slug].base = row;
      }
      
      lastSlug = slug;
    }
  }

  // Fallback: If some group doesn't have a defined base template, use the first variant's details
  for (const slug in productGroups) {
    if (!productGroups[slug].base && productGroups[slug].variants.length > 0) {
      productGroups[slug].base = productGroups[slug].variants[0];
    }
  }

  // Gather unique category names/IDs and merchant IDs
  const uniqueCategoryIds = [...new Set(Object.values(productGroups).map((g) => g.base.category_id))];
  const uniqueMerchantIds = [...new Set(Object.values(productGroups).map((g) => g.base.merchant_id).filter(Boolean))];

  // Resolve Categories (ID or Name)
  const categories = await tx.category.findMany({
    where: {
      OR: [
        { id: { in: uniqueCategoryIds } },
        { name: { in: uniqueCategoryIds } },
      ],
    },
  });
  
  const categoryMap = new Map();
  categories.forEach((cat) => {
    categoryMap.set(cat.id, cat.id);
    categoryMap.set(cat.name.toLowerCase(), cat.id);
  });

  // Automatically create any categories that don't exist
  for (const catIdOrName of uniqueCategoryIds) {
    const resolved = categoryMap.get(catIdOrName) || categoryMap.get(catIdOrName.toLowerCase());
    if (!resolved) {
      const newCat = await tx.category.create({
        data: { name: catIdOrName }
      });
      categoryMap.set(catIdOrName.toLowerCase(), newCat.id);
      categoryMap.set(newCat.id, newCat.id);
    }
  }

  // Resolve Merchants. If none exist, create a default merchant
  let defaultMerchant = await tx.merchant.findFirst();
  if (!defaultMerchant) {
    defaultMerchant = await tx.merchant.create({
      data: {
        name: "Vami Jewells",
        status: "ACTIVE"
      }
    });
  }

  const merchants = await tx.merchant.findMany({
    where: { id: { in: uniqueMerchantIds } }
  });
  const merchantMap = new Map();
  merchants.forEach((m) => merchantMap.set(m.id, m.id));

  let success = 0;
  let failed = 0;

  // 2. Loop over product groups to create products, options, values, and variants
  for (const slug in productGroups) {
    const group = productGroups[slug];
    const base = group.base;
    
    // Resolve Category ID
    const categoryId = categoryMap.get(base.category_id) || categoryMap.get(base.category_id.toLowerCase());
    
    // Resolve Merchant ID
    const merchantId = merchantMap.get(base.merchant_id) || defaultMerchant.id;

    try {
      // Create the main Product
      const product = await tx.product.create({
        data: {
          slug: slug,
          title: base.product_title,
          mainImage: base.main_image ?? "",
          price: Math.round(base.product_price),
          rating: base.rating,
          description: base.description,
          manufacturer: base.manufacturer,
          inStock: base.product_stock,
          categoryId: categoryId,
          merchantId: merchantId,
          occasion: base.occasion,
          collection: base.collection,
          images: base.images,
          metalType: base.metal_type,
          purity: base.purity,
          weight: base.weight,
          features: base.features,
          gender: base.gender,
          originalPrice: base.original_price ? Math.round(base.original_price) : null,
          featured: base.featured,
          isNewArrival: base.is_new_arrival,
          isBestseller: base.is_bestseller,
          sortPriority: base.sort_priority,
        }
      });

      // 3. Collect and create options (max 3)
      const optionsConfig = [
        { name: base.option_1_name, pos: base.option_1_position, valKey: "option_1_value", posKey: "option_1_position" },
        { name: base.option_2_name, pos: base.option_2_position, valKey: "option_2_value", posKey: "option_2_position" },
        { name: base.option_3_name, pos: base.option_3_position, valKey: "option_3_value", posKey: "option_3_position" }
      ].filter(o => o.name);

      const optionMap = {}; // optionName -> optionObj
      const optionValueMap = {}; // optionName_valueName -> valueObj

      for (const opt of optionsConfig) {
        const option = await tx.productOption.create({
          data: {
            productId: product.id,
            name: opt.name,
            position: opt.pos
          }
        });
        optionMap[opt.name] = option;

        // Collect all unique values for this option in the group
        const valuesInGroup = [...new Set(group.variants.map(v => v[opt.valKey]).filter(Boolean))];
        for (const val of valuesInGroup) {
          const valObj = await tx.productOptionValue.create({
            data: {
              optionId: option.id,
              value: val,
              position: 1 // Default position
            }
          });
          optionValueMap[`${opt.name}_${val}`] = valObj;
        }
      }

      // 4. Create variants and link them to their option values
      for (const variantRow of group.variants) {
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: variantRow.variant_sku,
            barcode: variantRow.variant_barcode,
            title: variantRow.variant_title || `${product.title} Variant`,
            position: variantRow.variant_position,
            price: variantRow.variant_price,
            compareAtPrice: variantRow.variant_compare_at_price,
            weight: variantRow.variant_weight,
            stockQuantity: variantRow.variant_stock_quantity,
            reservedQuantity: variantRow.variant_reserved_quantity,
            status: variantRow.variant_status,
          }
        });

        // Map option values to this variant
        for (const opt of optionsConfig) {
          const valVal = variantRow[opt.valKey];
          if (valVal) {
            const valObj = optionValueMap[`${opt.name}_${valVal}`];
            if (valObj) {
              await tx.variantOptionValue.create({
                data: {
                  variantId: variant.id,
                  optionValueId: valObj.id
                }
              });
            }
          }
        }

        // Record bulk upload item audit
        await tx.bulk_upload_item.create({
          data: {
            batchId,
            productId: product.id,
            title: base.product_title,
            slug: slug,
            price: variantRow.variant_price,
            manufacturer: base.manufacturer,
            description: base.description,
            mainImage: base.main_image,
            categoryId: categoryId,
            inStock: variantRow.variant_stock_quantity,
            status: "CREATED"
          }
        });
        success++;
      }
    } catch (e) {
      console.error(`Group creation failed for ${slug}:`, e);
      
      // Log errors in bulk upload item
      await tx.bulk_upload_item.create({
        data: {
          batchId,
          title: base?.product_title || slug,
          slug: slug,
          price: 0,
          categoryId: categoryId || base?.category_id || "",
          inStock: 0,
          status: "ERROR",
          error: e.message || "Failed to create product or variant"
        }
      });
      failed += group.variants.length;
    }
  }

  // Handle rows with pre-validation errors
  for (const err of errorRows) {
    await tx.bulk_upload_item.create({
      data: {
        batchId,
        title: "",
        slug: "",
        price: 0,
        categoryId: "",
        inStock: 0,
        status: "ERROR",
        error: `Row ${err.index}: ${err.error}`,
      },
    });
    failed++;
  }

  return { successCount: success, errorCount: failed };
}

async function getBatchSummary(prisma, batchId) {
  const total = await prisma.bulk_upload_item.count({ where: { batchId } });
  const errors = await prisma.bulk_upload_item.count({
    where: { batchId, status: "ERROR" },
  });
  const created = await prisma.bulk_upload_item.count({
    where: { batchId, status: "CREATED" },
  });
  const updated = await prisma.bulk_upload_item.count({
    where: { batchId, status: "UPDATED" },
  });
  return { total, errors, created, updated };
}

async function canDeleteProductsForBatch(prisma, batchId) {
  const items = await prisma.bulk_upload_item.findMany({
    where: { batchId, productId: { not: null } },
    select: { productId: true },
  });
  const productIds = items.map((i) => i.productId).filter(Boolean);

  if (productIds.length === 0) {
    return { canDelete: true, blockedProductIds: [] };
  }

  const referenced = await prisma.customer_order_product.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true },
  });

  const blocked = new Set(referenced.map((r) => r.productId));
  const blockedList = productIds.filter((id) => blocked.has(id));

  if (blockedList.length > 0) {
    return {
      canDelete: false,
      reason: "Some products are in orders",
      blockedProductIds: blockedList,
    };
  }

  return { canDelete: true, blockedProductIds: [] };
}

async function applyItemUpdates(tx, batchId, updates) {
  const ids = updates.map((u) => u.itemId);
  const items = await tx.bulk_upload_item.findMany({
    where: { id: { in: ids }, batchId },
    select: { id: true, productId: true },
  });
  const byId = new Map(items.map((i) => [i.id, i]));
  const result = [];

  for (const upd of updates) {
    const current = byId.get(upd.itemId);
    if (!current) continue;

    const price = Math.round(Number(upd.price));
    const inStock = Number(upd.inStock);

    if (current.productId) {
      await tx.product.update({
        where: { id: current.productId },
        data: { price, inStock },
      });
    }

    const updatedItem = await tx.bulk_upload_item.update({
      where: { id: upd.itemId },
      data: { price, inStock, status: "UPDATED", error: null },
    });
    result.push(updatedItem);
  }
  return result;
}

module.exports = {
  parseCsvBufferToRows,
  validateRow,
  createBatchWithItems,
  computeBatchStatus,
  getBatchSummary,
  canDeleteProductsForBatch,
  applyItemUpdates,
};
