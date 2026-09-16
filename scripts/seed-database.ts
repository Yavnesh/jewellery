import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
  console.log("==> Starting Comprehensive Database Seeding...");

  // 1. Seed Categories & Subcategories
  const parentMap: Record<string, string> = {};
  for (const parent of parentCategories) {
    const category = await prisma.category.upsert({
      where: { name: parent.name },
      update: { slug: parent.slug },
      create: { name: parent.name, slug: parent.slug },
    });
    parentMap[parent.slug] = category.id;
  }

  for (const sub of subcategories) {
    const parentId = parentMap[sub.parentSlug];
    if (!parentId) continue;
    const subcategory = await prisma.category.upsert({
      where: { name: `${sub.parentSlug}-${sub.name}` },
      update: { slug: sub.slug, parentId },
      create: { name: `${sub.parentSlug}-${sub.name}`, slug: sub.slug, parentId },
    });
  }
  console.log("✓ Categories and Subcategories seeded.");

  // 2. Ensure Default Merchant
  let merchant = await prisma.merchant.findFirst();
  if (!merchant) {
    merchant = await prisma.merchant.create({
      data: {
        name: "Vami Exports Haute Joaillerie",
        email: "concierge@vamiexports.com",
        phone: "+91 98765 43210",
        address: "Surat / Mumbai, Gujarat, India",
        status: "ACTIVE",
      },
    });
    console.log("✓ Merchant created:", merchant.name);
  }

  // 3. Ensure Admin & Demo Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@vamiexports.com" },
    update: { role: "admin" },
    create: {
      email: "admin@vamiexports.com",
      password: adminPassword,
      role: "admin",
      profile: {
        create: {
          firstName: "Master",
          lastName: "Admin",
          phone: "+91 99999 88888",
        },
      },
    },
  });
  console.log("✓ Admin user configured:", adminUser.email);

  // 4. Seed Rich Luxury Jewellery Products
  const ringsCatId = parentMap["rings"];
  const earringsCatId = parentMap["earrings"];
  const pendantsCatId = parentMap["pendants"];
  const necklacesCatId = parentMap["necklace"];
  const braceletsCatId = parentMap["bracelets"];
  const whiteDiamondsCatId = parentMap["white-loose-diamond"];
  const saltPepperCatId = parentMap["salt-and-pepper"];

  const productsToSeed = [
    {
      slug: "the-aurora-solitaire-diamond-ring",
      title: "The Aurora 1.5ct Solitaire Ring",
      mainImage: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80"
      ]),
      price: 185000,
      originalPrice: 210000,
      rating: 5,
      description: "Exquisitely hand-forged in 18K Yellow Gold, featuring a magnificent 1.5-carat round brilliant solitaire diamond graded VVS1 clarity. A timeless design celebrating eternal devotion.",
      manufacturer: "Vami Signature",
      inStock: 12,
      categoryId: ringsCatId,
      metalType: "18K Gold",
      purity: "VVS1 / G-Color",
      weight: 4.8,
      occasion: "Bridal & Engagement",
      collection: "Heritage Solitaire",
      featured: true,
      isBestseller: true,
      isNewArrival: true,
      sku: "VAMI-RNG-AURORA-01",
    },
    {
      slug: "celestial-cascade-diamond-necklace",
      title: "Celestial Cascade 18K Diamond Necklace",
      mainImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80"
      ]),
      price: 420000,
      originalPrice: 480000,
      rating: 5,
      description: "A cascade of hand-set marquise and brilliant round diamonds in handcrafted 18K white gold. Designed for unforgettable galas and red-carpet moments.",
      manufacturer: "Vami Signature",
      inStock: 5,
      categoryId: necklacesCatId,
      metalType: "18K White Gold",
      purity: "IF-VVS Clarity",
      weight: 32.5,
      occasion: "Grand Gala",
      collection: "Imperial Symphony",
      featured: true,
      isBestseller: true,
      isNewArrival: false,
      sku: "VAMI-NCK-CELESTIAL-02",
    },
    {
      slug: "radiance-colombian-emerald-drop-earrings",
      title: "Radiance Colombian Emerald Drop Earrings",
      mainImage: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80"
      ]),
      price: 95000,
      originalPrice: 115000,
      rating: 5,
      description: "Vibrant certified Colombian emerald drops flanked by brilliant halo diamonds suspended on delicate gold hooks.",
      manufacturer: "Vami Signature",
      inStock: 8,
      categoryId: earringsCatId,
      metalType: "18K Yellow Gold",
      purity: "Natural AAA Emerald",
      weight: 6.2,
      occasion: "Cocktail",
      collection: "Gemstone Masterpieces",
      featured: true,
      isBestseller: false,
      isNewArrival: true,
      sku: "VAMI-EAR-EMERALD-03",
    },
    {
      slug: "eternal-tennis-diamond-bracelet",
      title: "Eternal Diamond Tennis Bracelet (5.0 ctw)",
      mainImage: "https://images.unsplash.com/photo-1611591475836-5e58933b93f1?w=800&auto=format&fit=crop&q=80",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1611591475836-5e58933b93f1?w=800&auto=format&fit=crop&q=80"
      ]),
      price: 260000,
      originalPrice: 295000,
      rating: 5,
      description: "A seamless river of 5.0 carats total weight of brilliant cut natural diamonds set in a supple 18K white gold 4-prong setting with double security clasp.",
      manufacturer: "Vami Signature",
      inStock: 9,
      categoryId: braceletsCatId,
      metalType: "18K White Gold",
      purity: "VS1 / E-F Color",
      weight: 14.5,
      occasion: "Daily Luxury",
      collection: "Classic Essentials",
      featured: true,
      isBestseller: true,
      isNewArrival: false,
      sku: "VAMI-BRC-TENNIS-04",
    },
    {
      slug: "salt-pepper-kite-cut-solitaire-ring",
      title: "Mystique Salt & Pepper Kite-Cut Diamond Ring",
      mainImage: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80"
      ]),
      price: 135000,
      originalPrice: 155000,
      rating: 5,
      description: "A stunning 2.1ct natural geometric kite-cut salt & pepper diamond with galaxy inclusions, framed in 14K Rose Gold with pave side accents.",
      manufacturer: "Vami Artisans",
      inStock: 7,
      categoryId: saltPepperCatId,
      metalType: "14K Rose Gold",
      purity: "Natural Galaxy Diamond",
      weight: 3.9,
      occasion: "Alternative Bridal",
      collection: "Celestial Earth",
      featured: true,
      isBestseller: true,
      isNewArrival: true,
      sku: "VAMI-RNG-SALTP-KITE-05",
    },
    {
      slug: "flawless-marquise-loose-diamond-2ct",
      title: "Certified 2.05ct Marquise Cut Loose Diamond",
      mainImage: "https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80"
      ]),
      price: 340000,
      originalPrice: 380000,
      rating: 5,
      description: "IGI/GIA certified 2.05-carat loose marquise brilliant cut diamond. Excellent polish and symmetry, D color, VVS2 clarity. Perfect for bespoke custom rings.",
      manufacturer: "Vami Exports",
      inStock: 4,
      categoryId: whiteDiamondsCatId,
      metalType: "Loose Gemstone",
      purity: "D / VVS2",
      weight: 2.05,
      occasion: "Custom Commission",
      collection: "Loose Diamond Vault",
      featured: true,
      isBestseller: false,
      isNewArrival: true,
      sku: "VAMI-LSE-MARQUISE-06",
    },
    {
      slug: "solitaire-halo-diamond-pendant",
      title: "Imperial Halo Solitaire Diamond Pendant",
      mainImage: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80"
      ]),
      price: 78000,
      originalPrice: 92000,
      rating: 4,
      description: "Center 0.75ct brilliant diamond encircled by a double micro-pave diamond halo in 18K Rose Gold, suspended on an Italian cable chain.",
      manufacturer: "Vami Signature",
      inStock: 15,
      categoryId: pendantsCatId,
      metalType: "18K Rose Gold",
      purity: "VVS2 / F-Color",
      weight: 5.1,
      occasion: "Anniversary & Gifting",
      collection: "Heritage Solitaire",
      featured: false,
      isBestseller: true,
      isNewArrival: false,
      sku: "VAMI-PND-HALO-07",
    },
    {
      slug: "heritage-art-deco-diamond-bangle",
      title: "Royal Art Deco Handcrafted Gold Bangle",
      mainImage: "https://images.unsplash.com/photo-1611591475836-5e58933b93f1?w=800&auto=format&fit=crop&q=80",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1611591475836-5e58933b93f1?w=800&auto=format&fit=crop&q=80"
      ]),
      price: 215000,
      originalPrice: 240000,
      rating: 5,
      description: "Inspired by 1920s Art Deco architecture, handcrafted in solid 22K yellow gold adorned with baguette and round brilliant diamonds.",
      manufacturer: "Vami Artisans",
      inStock: 6,
      categoryId: parentMap["bangles"] || braceletsCatId,
      metalType: "22K Gold",
      purity: "VS / G-H Color",
      weight: 24.8,
      occasion: "Festive & Wedding",
      collection: "Art Deco Royal",
      featured: true,
      isBestseller: false,
      isNewArrival: true,
      sku: "VAMI-BNG-ARTDECO-08",
    }
  ];

  for (const prod of productsToSeed) {
    const product = await prisma.product.upsert({
      where: { slug: prod.slug },
      create: {
        slug: prod.slug,
        title: prod.title,
        mainImage: prod.mainImage,
        images: prod.images,
        price: prod.price,
        originalPrice: prod.originalPrice,
        rating: prod.rating,
        description: prod.description,
        manufacturer: prod.manufacturer,
        inStock: prod.inStock,
        categoryId: prod.categoryId,
        merchantId: merchant.id,
        metalType: prod.metalType,
        purity: prod.purity,
        weight: prod.weight,
        occasion: prod.occasion,
        collection: prod.collection,
        featured: prod.featured,
        isBestseller: prod.isBestseller,
        isNewArrival: prod.isNewArrival,
      },
      update: {
        title: prod.title,
        mainImage: prod.mainImage,
        images: prod.images,
        price: prod.price,
        originalPrice: prod.originalPrice,
        description: prod.description,
        inStock: prod.inStock,
        categoryId: prod.categoryId,
        featured: prod.featured,
        isBestseller: prod.isBestseller,
        isNewArrival: prod.isNewArrival,
      },
    });

    // Create / Upsert Product Variant
    const variant = await prisma.productVariant.upsert({
      where: { sku: prod.sku },
      create: {
        productId: product.id,
        sku: prod.sku,
        title: `${prod.title} (Standard)`,
        price: prod.price,
        compareAtPrice: prod.originalPrice,
        stockQuantity: prod.inStock,
        weight: prod.weight,
      },
      update: {
        stockQuantity: prod.inStock,
        price: prod.price,
      },
    });

    // Seed Inventory Aggregate
    await prisma.inventory.upsert({
      where: { variantId: variant.id },
      create: {
        variantId: variant.id,
        onHand: prod.inStock,
        reserved: 0,
        available: prod.inStock,
      },
      update: {
        onHand: prod.inStock,
        available: prod.inStock,
      },
    });

    console.log(`✓ Seeded Product: ${product.title} (${prod.sku})`);
  }

  // 5. Seed Discount Coupons
  await prisma.coupon.upsert({
    where: { code: "VAMI10" },
    create: {
      code: "VAMI10",
      discountType: "PERCENTAGE",
      value: 10,
      minOrderValue: 25000,
      maxDiscount: 50000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 86400000),
      usageLimit: 500,
      usedCount: 12,
    },
    update: {},
  });

  console.log("==> Database Seeding Finished Successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
