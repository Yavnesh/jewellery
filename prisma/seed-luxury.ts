import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const metals = ["Yellow Gold", "White Gold", "Rose Gold", "Two Tone", "Platinum"];
const purities = ["14K", "18K", "22K", "24K"];
const occasions = ["Wedding", "Daily Wear", "Office", "Party", "Festive", "Gift"];
const collections = ["Bridal", "Modern", "Heritage", "Minimal", "Signature", "Gemstone", "Diamond", "Emerald", "Ruby", "Sapphire", "Pearl"];
const genders = ["Women", "Men", "Kids", "Unisex"];
const featuresList = ["New Arrival", "Best Seller", "Virtual Try-On", "Limited Edition", "Customizable"];

async function main() {
  console.log("Starting luxury seeding...");
  
  // Clear existing products to ensure clean slate for variant architecture
  console.log("Clearing existing products...");
  await prisma.product.deleteMany({});
  await prisma.productOption.deleteMany({});
  await prisma.productOptionValue.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.category.deleteMany({});

  // Ensure category and merchant exist
  const defaultCategory = await prisma.category.upsert({
    where: { name: "Rings" },
    update: {},
    create: { name: "Rings" },
  });
  const defaultMerchant = await prisma.merchant.create({
    data: { name: "Luxury Brand", status: "ACTIVE" },
  });

  for (let i = 0; i < 120; i++) {
    const originalPrice = faker.number.int({ min: 500, max: 15000 });
    const hasDiscount = Math.random() > 0.7;
    const price = hasDiscount ? originalPrice * 0.8 : originalPrice;

    // Pick 2 random features
    const selectedFeatures = faker.helpers.arrayElements(featuresList, 2).join(",");

    const isBestseller = Math.random() > 0.8;
    const isNewArrival = Math.random() > 0.7;
    const featured = Math.random() > 0.9;

    const productType = faker.helpers.arrayElement(["Ring", "Necklace", "Earrings", "Bracelet"]);
    
    // Create product
    const product = await prisma.product.create({
      data: {
        title: faker.commerce.productName() + " " + productType,
        slug: faker.lorem.slug() + "-" + i,
        description: faker.commerce.productDescription(),
        mainImage: "/product_placeholder.jpg",
        images: "[]",
        price: Math.floor(price),
        originalPrice: originalPrice,
        rating: faker.number.int({ min: 3, max: 5 }),
        manufacturer: "Luxury Brand",
        inStock: faker.number.int({ min: 0, max: 20 }),
        categoryId: defaultCategory.id,
        merchantId: defaultMerchant.id,
        metalType: faker.helpers.arrayElement(metals),
        purity: faker.helpers.arrayElement(purities),
        weight: faker.number.float({ min: 2, max: 25, fractionDigits: 2 }),
        occasion: faker.helpers.arrayElement(occasions),
        collection: faker.helpers.arrayElement(collections),
        gender: faker.helpers.arrayElement(genders),
        features: selectedFeatures,
        isBestseller,
        isNewArrival,
        featured,
      },
    });

    // Create Options based on product type
    if (productType === "Ring") {
      const sizeOption = await prisma.productOption.create({
        data: {
          productId: product.id,
          name: "Ring Size",
          position: 1,
        }
      });
      const sizes = ["5", "6", "7", "8"];
      
      const optionValues = [];
      for (const size of sizes) {
        const ov = await prisma.productOptionValue.create({
          data: {
            optionId: sizeOption.id,
            value: `Size ${size}`,
            position: parseInt(size)
          }
        });
        optionValues.push(ov);
      }

      // Create Variants
      for (let j = 0; j < optionValues.length; j++) {
        const sku = `SKU-${product.id.substring(0,6).toUpperCase()}-${sizes[j]}`;
        const variantPrice = Math.floor(price) + (j * 100); // Size increases price slightly
        
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku,
            price: variantPrice,
            compareAtPrice: hasDiscount ? originalPrice + (j * 100) : null,
            stockQuantity: faker.number.int({ min: 0, max: 10 }),
            status: "ACTIVE",
            optionValues: {
              create: [
                { optionValueId: optionValues[j].id }
              ]
            }
          }
        });
      }
    } else {
      // Create a default single variant for non-rings
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `SKU-${product.id.substring(0,8).toUpperCase()}-DEF`,
          price: Math.floor(price),
          compareAtPrice: hasDiscount ? originalPrice : null,
          stockQuantity: faker.number.int({ min: 0, max: 10 }),
          status: "ACTIVE"
        }
      });
    }
  }

  console.log("Luxury seeding completed. 120 products with variants created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
