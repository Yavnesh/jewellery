import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log("=== Category Taxonomy Report ===");
  for (const cat of categories) {
    const count = await prisma.product.count({ where: { categoryId: cat.id } });
    console.log(`Name: "${cat.name}" | ID: ${cat.id} | Product Count: ${count}`);
  }

  const products = await prisma.product.findMany({ take: 20 });
  console.log("=== Sample Product Attributes ===");
  products.forEach((p) => {
    console.log(`Title: "${p.title}" | Occasion: ${p.occasion} | Collection: ${p.collection} | MetalType: ${p.metalType} | Purity: ${p.purity}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
