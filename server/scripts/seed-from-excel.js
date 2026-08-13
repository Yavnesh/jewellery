const path = require("path");
// Load env from server/.env then fallback to project root .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const prisma = require("../utills/db");
const fs = require("fs");
const { parseCsvBufferToRows, validateRow, createBatchWithItems } = require("../services/bulkUploadService");

async function seed() {
  console.log("🚀 Starting database clear and seeding process...");
  
  const excelFilePath = "/Users/yavnesh/Workplace/jewellery/docs/vamijewells_products_bulk_upload_filled.xlsx";
  if (!fs.existsSync(excelFilePath)) {
    console.error(`❌ Excel file not found at ${excelFilePath}`);
    process.exit(1);
  }

  // 1. Clear database tables in order
  console.log("🧹 Clearing existing product data tables...");
  try {
    await prisma.$transaction(async (tx) => {
      // Clear dependent order items first to avoid foreign key violations
      await tx.customer_order_product.deleteMany({});
      await tx.wishlist.deleteMany({});
      await tx.cartItem.deleteMany({});
      await tx.inventoryEvent.deleteMany({});
      
      // Clear bulk upload logs
      await tx.bulk_upload_item.deleteMany({});
      await tx.bulk_upload_batch.deleteMany({});

      // Clear variant relations
      await tx.variantOptionValue.deleteMany({});
      await tx.productOptionValue.deleteMany({});
      await tx.productOption.deleteMany({});
      
      // Clear main products and categories
      await tx.productVariant.deleteMany({});
      await tx.product.deleteMany({});
      await tx.category.deleteMany({});
    });
    console.log("✅ Database tables cleared successfully!");
  } catch (error) {
    console.error("❌ Failed to clear database:", error);
    process.exit(1);
  }

  // 2. Read and parse Excel file
  console.log(`📖 Reading Excel file from ${excelFilePath}...`);
  const excelBuffer = fs.readFileSync(excelFilePath);
  const rows = await parseCsvBufferToRows(excelBuffer);
  console.log(`📊 Total rows found in sheet: ${rows.length}`);

  // 3. Validate rows
  const validRows = [];
  const invalidRows = [];
  for (let i = 0; i < rows.length; i++) {
    const { ok, data, error } = validateRow(rows[i]);
    if (ok) {
      // Clean up values like REPLACE_WITH_MERCHANT_ID / REPLACE_WITH_CATEGORY_ID
      if (data.merchant_id === "REPLACE_WITH_MERCHANT_ID") {
        data.merchant_id = null; // Will fallback to default merchant
      }
      validRows.push(data);
    } else {
      invalidRows.push({ index: i + 1, error });
    }
  }

  console.log(`✅ Validated rows: ${validRows.length}`);
  console.log(`❌ Invalid rows: ${invalidRows.length}`);
  if (invalidRows.length > 0) {
    console.warn("⚠️ Warning: Some rows have validation errors:");
    invalidRows.slice(0, 10).forEach(e => console.warn(`   - Row ${e.index}: ${e.error}`));
  }

  // 4. Create seeding batch and upload items
  console.log("🌱 Inserting data into database...");
  try {
    const batch = await prisma.bulk_upload_batch.create({
      data: {
        fileName: "vamijewells_products_bulk_upload_filled.xlsx",
        status: "PENDING",
        itemCount: rows.length,
        errorCount: invalidRows.length
      }
    });

    const { successCount, errorCount } = await createBatchWithItems(
      prisma,
      batch.id,
      validRows,
      invalidRows
    );

    await prisma.bulk_upload_batch.update({
      where: { id: batch.id },
      data: {
        status: "COMPLETED",
        itemCount: successCount + errorCount,
        errorCount
      }
    });

    console.log(`🎉 Seeding complete! Successfully seeded ${successCount} items.`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
