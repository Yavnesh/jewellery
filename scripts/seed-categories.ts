import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const parentCategories = [
  { name: "Rings", slug: "rings" },
  { name: "Earrings", slug: "earrings" },
  { name: "Pendants", slug: "pendants" },
  { name: "Bracelets", slug: "bracelets" },
  { name: "Bangles", slug: "bangles" },
  { name: "Necklace", slug: "necklace" },
  { name: "Broches", slug: "broches" },
  { name: "Charms", slug: "charms" },
  { name: "White Loose Diamond", slug: "white-loose-diamond" },
  { name: "Salt & Pepper", slug: "salt-and-pepper" },
];

const subcategories = [
  // Rings
  { name: "Diamond Mens", slug: "diamond-mens", parentSlug: "rings" },
  { name: "Diamond Womens", slug: "diamond-womens", parentSlug: "rings" },
  { name: "Engagement", slug: "engagement", parentSlug: "rings" },
  // Earrings
  { name: "Hanging", slug: "hanging", parentSlug: "earrings" },
  { name: "Tops", slug: "tops", parentSlug: "earrings" },
  // Pendants
  { name: "Sets", slug: "sets", parentSlug: "pendants" },
  { name: "Single", slug: "single", parentSlug: "pendants" },
  // White Loose Diamond
  { name: "Round", slug: "white-loose-diamond-round", parentSlug: "white-loose-diamond" },
  { name: "Marqueue", slug: "white-loose-diamond-marqueue", parentSlug: "white-loose-diamond" },
  { name: "Oval", slug: "white-loose-diamond-oval", parentSlug: "white-loose-diamond" },
  { name: "Kite", slug: "white-loose-diamond-kite", parentSlug: "white-loose-diamond" },
  { name: "Shield", slug: "white-loose-diamond-shield", parentSlug: "white-loose-diamond" },
  { name: "Emerald", slug: "white-loose-diamond-emerald", parentSlug: "white-loose-diamond" },
  { name: "Hexagon", slug: "white-loose-diamond-hexagon", parentSlug: "white-loose-diamond" },
  // Salt & Pepper
  { name: "Round", slug: "salt-and-pepper-round", parentSlug: "salt-and-pepper" },
  { name: "Marqueue", slug: "salt-and-pepper-marqueue", parentSlug: "salt-and-pepper" },
  { name: "Oval", slug: "salt-and-pepper-oval", parentSlug: "salt-and-pepper" },
  { name: "Kite", slug: "salt-and-pepper-kite", parentSlug: "salt-and-pepper" },
  { name: "Shield", slug: "salt-and-pepper-shield", parentSlug: "salt-and-pepper" },
  { name: "Emerald", slug: "salt-and-pepper-emerald", parentSlug: "salt-and-pepper" },
  { name: "Hexagon", slug: "salt-and-pepper-hexagon", parentSlug: "salt-and-pepper" },
];

async function main() {
  console.log("Starting idempotent Category Seeding...");

  // 1. Seed Parent Categories
  const parentMap: Record<string, string> = {};
  for (const parent of parentCategories) {
    const category = await prisma.category.upsert({
      where: { name: parent.name },
      update: { slug: parent.slug },
      create: { name: parent.name, slug: parent.slug },
    });
    parentMap[parent.slug] = category.id;
    console.log(`Seeded parent category: ${category.name} (${category.slug})`);
  }

  // 2. Seed Subcategories
  for (const sub of subcategories) {
    const parentId = parentMap[sub.parentSlug];
    if (!parentId) {
      console.error(`Parent ID not found for parentSlug: ${sub.parentSlug}`);
      continue;
    }

    const subcategory = await prisma.category.upsert({
      where: { name: `${sub.parentSlug}-${sub.name}` }, // Use composite/unique names to support duplicated subcategories
      update: {
        slug: sub.slug,
        parentId,
      },
      create: {
        name: `${sub.parentSlug}-${sub.name}`, // To keep name unique
        slug: sub.slug,
        parentId,
      },
    });
    console.log(`Seeded subcategory: ${subcategory.name} (${subcategory.slug}) linked to parent ${sub.parentSlug}`);
  }

  console.log("Category Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
