import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill for product and category translations...");

  // 1. Backfill Categories
  const categories = await prisma.category.findMany({
    include: { translations: true }
  });

  console.log(`Found ${categories.length} categories to verify.`);
  for (const cat of categories) {
    const hasEnglish = cat.translations.some(t => t.locale === "en");
    if (!hasEnglish) {
      await prisma.categoryTranslation.create({
        data: {
          categoryId: cat.id,
          locale: "en",
          name: cat.name
        }
      });
      console.log(`Created English translation for category: ${cat.name}`);
    }
  }

  // 2. Backfill Products
  const products = await prisma.product.findMany({
    include: { translations: true }
  });

  console.log(`Found ${products.length} products to verify.`);
  for (const prod of products) {
    const hasEnglish = prod.translations.some(t => t.locale === "en");
    if (!hasEnglish) {
      await prisma.productTranslation.create({
        data: {
          productId: prod.id,
          locale: "en",
          title: prod.title,
          description: prod.description,
          slug: prod.slug
        }
      });
      console.log(`Created English translation for product: ${prod.title}`);
    }
  }

  console.log("Backfill completed successfully!");
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
