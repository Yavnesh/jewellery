import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding sample Hindi translations for products and categories...");

  // 1. Localize Categories
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    let hiName = cat.name;
    if (cat.name === "Gold") hiName = "सोना";
    else if (cat.name === "Diamond") hiName = "हीरा";
    else if (cat.name === "Earrings") hiName = "झुमके";
    else if (cat.name === "Rings") hiName = "अंगूठियां";

    await prisma.categoryTranslation.upsert({
      where: {
        categoryId_locale: {
          categoryId: cat.id,
          locale: "hi"
        }
      },
      update: { name: hiName },
      create: {
        categoryId: cat.id,
        locale: "hi",
        name: hiName
      }
    });
  }
  console.log("Category Hindi translations set!");

  // 2. Localize a sample Product (let's find the first one)
  const products = await prisma.product.findMany({ take: 5 });
  for (const prod of products) {
    const hiTitle = `शानदार ${prod.title}`;
    const hiDescription = `${prod.title} - एक सुंदर और विशेष हस्तनिर्मित आभूषण।`;
    const hiSlug = `${prod.slug}-hi`;

    await prisma.productTranslation.upsert({
      where: {
        productId_locale: {
          productId: prod.id,
          locale: "hi"
        }
      },
      update: {
        title: hiTitle,
        description: hiDescription,
        slug: hiSlug
      },
      create: {
        productId: prod.id,
        locale: "hi",
        title: hiTitle,
        description: hiDescription,
        slug: hiSlug
      }
    });
    console.log(`Created Hindi translation for product: ${prod.title} -> ${hiTitle}`);
  }

  console.log("Hindi translations populated successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
