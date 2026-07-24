const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const demoMerchant = [
  {
    id: "1",
    name: "Vamika Jewels Merchant Boutique",
    description: "Curators of premium luxury jewelry and custom gemstones.",
    phone: "1234567890",
    address: "100 Vamika Jewels St, Luxury District, NY 10001",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

const demoCategories = [
  {
    id: "cat-rings",
    name: "rings",
  },
  {
    id: "cat-necklaces",
    name: "necklaces",
  },
  {
    id: "cat-bracelets",
    name: "bracelets",
  },
  {
    id: "cat-earrings",
    name: "earrings",
  }
];

const demoProducts = [
  // --- RINGS ---
  {
    id: "1",
    title: "Classic Diamond Solitaire Ring",
    price: 1200,
    rating: 5,
    description: "A stunning, brilliant-cut solitaire diamond set on a premium 18k solid gold band.",
    mainImage: "product1.webp",
    slug: "classic-diamond-solitaire-ring",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-rings",
    inStock: 5,
    merchantId: "1",
    occasion: "Engagement",
    collection: "Diamond",
    images: "product1.webp,product2.webp,product3.webp",
  },
  {
    id: "2",
    title: "Vintage Gold Band",
    price: 450,
    rating: 4,
    description: "An elegant, classically designed gold band inspired by vintage jewelry layouts.",
    mainImage: "product2.webp",
    slug: "vintage-gold-band",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-rings",
    inStock: 8,
    merchantId: "1",
    occasion: "Wedding",
    collection: "Gold",
    images: "product2.webp,product1.webp,product3.webp",
  },
  {
    id: "3",
    title: "Emerald Cut Diamond Ring",
    price: 1800,
    rating: 5,
    description: "A modern classic featuring a clean, rectangular emerald-cut emerald stone framed by diamonds.",
    mainImage: "product3.webp",
    slug: "emerald-cut-diamond-ring",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-rings",
    inStock: 3,
    merchantId: "1",
    occasion: "Anniversary",
    collection: "Diamond",
    images: "product3.webp,product1.webp,product2.webp",
  },
  {
    id: "11",
    title: "Minimalist Rose Gold Ring",
    price: 380,
    rating: 4,
    description: "Delicate 14k rose gold band with micro-pave set diamond accents, perfect for daily styling.",
    mainImage: "product2.webp",
    slug: "minimalist-rose-gold-ring",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-rings",
    inStock: 10,
    merchantId: "1",
    occasion: "Daily Wear",
    collection: "Everyday",
    images: "product2.webp,product1.webp",
  },
  {
    id: "12",
    title: "Royal Sapphire Statement Ring",
    price: 2200,
    rating: 5,
    description: "An absolute showstopper featuring a deep blue royal sapphire flanked by shimmering baguette diamonds.",
    mainImage: "product3.webp",
    slug: "royal-sapphire-statement-ring",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-rings",
    inStock: 2,
    merchantId: "1",
    occasion: "Festive",
    collection: "Bridal",
    images: "product3.webp,product1.webp",
  },

  // --- NECKLACES ---
  {
    id: "4",
    title: "18k Gold Chain Necklace",
    price: 750,
    rating: 5,
    description: "A thick, heavy, solid gold links chain that sits elegantly on the collarbone.",
    mainImage: "product4.webp",
    slug: "18k-gold-chain-necklace",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-necklaces",
    inStock: 12,
    merchantId: "1",
    occasion: "Daily Wear",
    collection: "Gold",
    images: "product4.webp,product5.webp,product6.webp",
  },
  {
    id: "5",
    title: "Freshwater Pearl Pendant",
    price: 320,
    rating: 4,
    description: "A luminous, hand-selected freshwater white pearl suspended on a thin gold chain.",
    mainImage: "product5.webp",
    slug: "freshwater-pearl-pendant",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-necklaces",
    inStock: 15,
    merchantId: "1",
    occasion: "Birthday",
    collection: "Everyday",
    images: "product5.webp,product4.webp,product6.webp",
  },
  {
    id: "6",
    title: "Diamond Tennis Necklace",
    price: 3500,
    rating: 5,
    description: "An extraordinary necklace containing a continuous row of round brilliant-cut diamonds.",
    mainImage: "product6.webp",
    slug: "diamond-tennis-necklace",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-necklaces",
    inStock: 2,
    merchantId: "1",
    occasion: "Wedding",
    collection: "Diamond",
    images: "product6.webp,product4.webp,product5.webp",
  },
  {
    id: "13",
    title: "Ruby Halo Floral Pendant",
    price: 950,
    rating: 5,
    description: "Stunning crimson ruby heart enclosed within a halo of pear-cut diamonds on an 18k white gold link chain.",
    mainImage: "product5.webp",
    slug: "ruby-halo-floral-pendant",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-necklaces",
    inStock: 6,
    merchantId: "1",
    occasion: "Anniversary",
    collection: "Diamond",
    images: "product5.webp,product4.webp",
  },
  {
    id: "14",
    title: "Aura Gold Choker Set",
    price: 4200,
    rating: 5,
    description: "Grand traditional 22k gold choker necklace featuring antique filigree work and drop design.",
    mainImage: "product4.webp",
    slug: "aura-gold-choker-set",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-necklaces",
    inStock: 3,
    merchantId: "1",
    occasion: "Wedding",
    collection: "Bridal",
    images: "product4.webp,product6.webp",
  },

  // --- BRACELETS ---
  {
    id: "7",
    title: "Classic Diamond Tennis Bracelet",
    price: 2400,
    rating: 5,
    description: "A timeless tennis bracelet set with matching diamonds for a continuous shimmer.",
    mainImage: "product7.webp",
    slug: "classic-diamond-tennis-bracelet",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-bracelets",
    inStock: 4,
    merchantId: "1",
    occasion: "Anniversary",
    collection: "Diamond",
    images: "product7.webp,product8.webp",
  },
  {
    id: "8",
    title: "Solid Gold Bangle",
    price: 950,
    rating: 4,
    description: "A minimal, sleek gold bangle perfect for stacking or wearing on its own.",
    mainImage: "product8.webp",
    slug: "solid-gold-bangle",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-bracelets",
    inStock: 10,
    merchantId: "1",
    occasion: "Festive",
    collection: "Gold",
    images: "product8.webp,product7.webp",
  },
  {
    id: "15",
    title: "Emperor Emerald Cuff",
    price: 3100,
    rating: 5,
    description: "Exquisite 18k yellow gold bangle embellished with octagonal Colombian emeralds.",
    mainImage: "product7.webp",
    slug: "emperor-emerald-cuff",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-bracelets",
    inStock: 3,
    merchantId: "1",
    occasion: "Festive",
    collection: "Bridal",
    images: "product7.webp,product8.webp",
  },
  {
    id: "16",
    title: "Dainty Infinity Charm Bracelet",
    price: 290,
    rating: 4,
    description: "Delicate and sleek silver infinity charm linked to an adjustable high-quality platinum chain.",
    mainImage: "product8.webp",
    slug: "dainty-infinity-charm-bracelet",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-bracelets",
    inStock: 18,
    merchantId: "1",
    occasion: "Daily Wear",
    collection: "Everyday",
    images: "product8.webp,product7.webp",
  },
  {
    id: "17",
    title: "Golden Hour Mesh Bracelet",
    price: 650,
    rating: 4,
    description: "Intricately woven gold mesh bracelet with a sleek magnetic clasp, designed for day-to-night styling.",
    mainImage: "product8.webp",
    slug: "golden-hour-mesh-bracelet",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-bracelets",
    inStock: 9,
    merchantId: "1",
    occasion: "Office Wear",
    collection: "Gold",
    images: "product8.webp",
  },

  // --- EARRINGS ---
  {
    id: "9",
    title: "Diamond Stud Earrings",
    price: 850,
    rating: 5,
    description: "A pair of classic four-prong diamond stud earrings that add elegance to any outfit.",
    mainImage: "product9.webp",
    slug: "diamond-stud-earrings",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-earrings",
    inStock: 7,
    merchantId: "1",
    occasion: "Office Wear",
    collection: "Diamond",
    images: "product9.webp,product10.webp",
  },
  {
    id: "10",
    title: "Gold Hoop Earrings",
    price: 280,
    rating: 4,
    description: "Lightweight, everyday gold hoop earrings with an elegant, polished clasp.",
    mainImage: "product10.webp",
    slug: "gold-hoop-earrings",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-earrings",
    inStock: 20,
    merchantId: "1",
    occasion: "Daily Wear",
    collection: "Gold",
    images: "product10.webp,product9.webp",
  },
  {
    id: "18",
    title: "Teardrop Pearl Drops",
    price: 490,
    rating: 5,
    description: "Luminous baroque pearl drop earrings suspended from a leaf-motif diamond setting.",
    mainImage: "product9.webp",
    slug: "teardrop-pearl-drops",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-earrings",
    inStock: 11,
    merchantId: "1",
    occasion: "Engagement",
    collection: "Everyday",
    images: "product9.webp,product10.webp",
  },
  {
    id: "19",
    title: "Mayur Peacock Jhumkas",
    price: 1600,
    rating: 5,
    description: "Exquisite peacock motif traditional jhumka earrings set in 22k gold with ruby bead hangings.",
    mainImage: "product10.webp",
    slug: "mayur-peacock-jhumkas",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-earrings",
    inStock: 4,
    merchantId: "1",
    occasion: "Festive",
    collection: "Bridal",
    images: "product10.webp,product9.webp",
  },
  {
    id: "20",
    title: "Emerald Aura Studs",
    price: 1100,
    rating: 5,
    description: "Vibrant square-cut emerald studs surrounded by a halo of brilliant-cut pave diamonds.",
    mainImage: "product9.webp",
    slug: "emerald-aura-studs",
    manufacturer: "Vamika Jewels Fine Craftsmanship",
    categoryId: "cat-earrings",
    inStock: 8,
    merchantId: "1",
    occasion: "Anniversary",
    collection: "Diamond",
    images: "product9.webp,product10.webp",
  }
];

async function insertDemoData() {
  console.log("Clearing existing tables...");
  await prisma.customer_order_product.deleteMany({});
  await prisma.customer_order.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.bulk_upload_item.deleteMany({});
  await prisma.bulk_upload_batch.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.merchant.deleteMany({});
  console.log("Database cleared successfully!");

  for (const merchant of demoMerchant) {
    await prisma.merchant.create({
      data: merchant,
    });
  }
  console.log("Demo merchant inserted successfully!");

  for (const category of demoCategories) {
    await prisma.category.create({
      data: category,
    });
  }
  console.log("Demo categories inserted successfully!");

  for (const product of demoProducts) {
    await prisma.product.create({
      data: product,
    });
  }
  console.log("Demo products inserted successfully!");
}

insertDemoData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });