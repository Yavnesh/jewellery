import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth } from "@/lib/adminAuthHelper";

export async function POST(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    // 1. Ensure Categories exist
    const defaultCategories = [
      { name: "Diamond Rings", slug: "diamond-rings" },
      { name: "Gold Necklaces", slug: "gold-necklaces" },
      { name: "Earrings & Studs", slug: "earrings-studs" },
      { name: "Bracelets & Bangles", slug: "bracelets-bangles" },
      { name: "Solitaire Collection", slug: "solitaire-collection" },
    ];

    for (const cat of defaultCategories) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        create: { name: cat.name, slug: cat.slug },
        update: {},
      });
    }

    const categories = await prisma.category.findMany();
    const catRings = categories.find((c) => c.slug === "diamond-rings") || categories[0];
    const catNecklaces = categories.find((c) => c.slug === "gold-necklaces") || categories[1];
    const catEarrings = categories.find((c) => c.slug === "earrings-studs") || categories[2];

    // 2. Ensure Merchant exists
    let merchant = await prisma.merchant.findFirst();
    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: {
          name: "Vamika Luxe Haute Joaillerie",
          email: "concierge@vamika.com",
          phone: "+91 98765 43210",
          address: "Bandra West, Mumbai, MH, India",
          status: "ACTIVE",
        },
      });
    }

    // 3. Ensure Realistic Luxury Products
    const realisticProducts = [
      {
        slug: "aurora-solitaire-diamond-ring",
        title: "The Aurora 1.5ct Solitaire Ring",
        mainImage: "/images/ring1.jpg",
        price: 185000,
        originalPrice: 210000,
        rating: 5,
        description: "Exquisitely crafted in 18K Yellow Gold featuring a brilliant round cut VVS1 clarity solitaire diamond.",
        manufacturer: "Vamika Signature",
        inStock: 14,
        categoryId: catRings.id,
        metalType: "18K Gold",
        purity: "VVS1",
        weight: 4.8,
        occasion: "Bridal & Engagement",
        collection: "Heritage 2026",
        featured: true,
        isBestseller: true,
        sku: "AUR-RNG-01",
      },
      {
        slug: "celestial-cascade-diamond-necklace",
        title: "Celestial Cascade Diamond Necklace",
        mainImage: "/images/necklace1.jpg",
        price: 420000,
        originalPrice: 480000,
        rating: 5,
        description: "A cascade of hand-set marquise and brilliant round diamonds in handcrafted 18K white gold.",
        manufacturer: "Vamika Signature",
        inStock: 6,
        categoryId: catNecklaces.id,
        metalType: "18K White Gold",
        purity: "IF Clarity",
        weight: 32.5,
        occasion: "Grand Gala",
        collection: "Imperial Symphony",
        featured: true,
        isBestseller: true,
        sku: "CEL-NCK-02",
      },
      {
        slug: "radiance-emerald-drop-earrings",
        title: "Radiance Colombian Emerald Drop Earrings",
        mainImage: "/images/earrings1.jpg",
        price: 95000,
        originalPrice: 115000,
        rating: 4,
        description: "Vibrant Colombian emeralds flanked by brilliant halo diamonds suspended on delicate gold hooks.",
        manufacturer: "Vamika Signature",
        inStock: 3, // Low stock demo
        categoryId: catEarrings.id,
        metalType: "18K Yellow Gold",
        purity: "Natural Emerald",
        weight: 6.2,
        occasion: "Cocktail",
        collection: "Gemstone Masterpieces",
        featured: false,
        isBestseller: false,
        sku: "RAD-EAR-03",
      },
    ];

    for (const prod of realisticProducts) {
      const p = await prisma.product.upsert({
        where: { slug: prod.slug },
        create: {
          slug: prod.slug,
          title: prod.title,
          mainImage: prod.mainImage,
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
        },
        update: {
          inStock: prod.inStock,
          price: prod.price,
        },
      });

      // Upsert variant
      await prisma.productVariant.upsert({
        where: { sku: prod.sku },
        create: {
          productId: p.id,
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
    }

    // 4. Ensure Demo Coupons
    await prisma.coupon.upsert({
      where: { code: "LUXE2026" },
      create: {
        code: "LUXE2026",
        discountType: "PERCENTAGE",
        value: 10,
        minOrderValue: 50000,
        maxDiscount: 25000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 86400000),
        usageLimit: 200,
        usedCount: 24,
      },
      update: {},
    });

    await prisma.coupon.upsert({
      where: { code: "ROYALTY5K" },
      create: {
        code: "ROYALTY5K",
        discountType: "FIXED",
        value: 5000,
        minOrderValue: 75000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 86400000),
        usageLimit: 100,
        usedCount: 18,
      },
      update: {},
    });

    // 5. Ensure Demo Customers & Orders
    const sampleCustomer = await prisma.user.upsert({
      where: { email: "priya.sharma@luxuryclient.com" },
      create: {
        email: "priya.sharma@luxuryclient.com",
        role: "user",
        profile: {
          create: {
            firstName: "Priya",
            lastName: "Sharma",
            phone: "+91 98200 11223",
          },
        },
        addresses: {
          create: {
            firstName: "Priya",
            lastName: "Sharma",
            phone: "+91 98200 11223",
            line1: "42, Pali Hill",
            line2: "Near Nargis Dutt Road",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400050",
            countryCode: "IN",
            isDefault: true,
          },
        },
      },
      update: {},
    });

    // Create a demo order if count is 0
    const orderCount = await prisma.customer_order.count();
    if (orderCount === 0) {
      const createdOrder = await prisma.customer_order.create({
        data: {
          name: "Priya",
          lastname: "Sharma",
          email: "priya.sharma@luxuryclient.com",
          phone: "+91 98200 11223",
          company: "Private Collector",
          adress: "42, Pali Hill",
          apartment: "Villa 4",
          postalCode: "400050",
          city: "Mumbai",
          country: "India",
          status: "processing",
          paymentStatus: "SUCCEEDED",
          total: 185000,
          userId: sampleCustomer.id,
          shipments: {
            create: [
              {
                provider: "BLUEDART",
                courier: "BlueDart Apex Secured",
                service: "Apex Armored High-Value Transit",
                trackingNumber: "BD-SEC-9847192",
                status: "OUT_FOR_DELIVERY",
                insuranceValue: 185000,
                signatureReq: true,
                estimatedDeliveryAt: new Date(),
                events: {
                  create: [
                    {
                      status: "OUT_FOR_DELIVERY",
                      carrierStatus: "WITH_COURIER",
                      description: "Out with dedicated armored courier for OTP signature handoff",
                      location: "Bandra Hub, Mumbai",
                      source: "CARRIER",
                    },
                    {
                      status: "IN_TRANSIT",
                      carrierStatus: "ARRIVED_HUB",
                      description: "Arrived at Mumbai Central Secured Sorting Vault",
                      location: "Mumbai Hub",
                      source: "CARRIER",
                    },
                    {
                      status: "LABEL_CREATED",
                      carrierStatus: "MANIFEST_CREATED",
                      description: "Shipment manifested and sealed in tamper-evident pouch",
                      location: "Jaipur Vault",
                      source: "ADMIN",
                    },
                  ],
                },
              },
            ],
          },
        },
      });

      // Add audit log
      await prisma.auditLog.create({
        data: {
          actorId: "system",
          action: "SEED_SAMPLE_ORDER",
          entityType: "ORDER",
          entityId: createdOrder.id,
          newValue: JSON.stringify(createdOrder),
        },
      });
    }

    return NextResponse.json({ success: true, message: "Demo catalog & operational data seeded successfully" });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message || "Failed to seed sample data" }, { status: 500 });
  }
}
