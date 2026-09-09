import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";

export async function GET(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const categoryId = searchParams.get("categoryId") || "";
    const stockStatus = searchParams.get("stockStatus") || "";
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "sortPriority";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: any = {};

    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    if (stockStatus === "inStock") {
      where.inStock = { gt: 5 };
    } else if (stockStatus === "lowStock") {
      where.inStock = { gt: 0, lte: 5 };
    } else if (stockStatus === "outOfStock") {
      where.inStock = { lte: 0 };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
        { manufacturer: { contains: search } },
        { metalType: { contains: search } },
      ];
    }

    const [products, total, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: { select: { id: true, name: true } },
          variants: { select: { id: true, sku: true, price: true, stockQuantity: true } },
          merchant: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({ select: { id: true, name: true } }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        mainImage: p.mainImage,
        price: p.price,
        originalPrice: p.originalPrice,
        inStock: p.inStock,
        rating: p.rating,
        category: p.category?.name || "Uncategorized",
        categoryId: p.categoryId,
        merchant: p.merchant?.name || "Primary",
        metalType: p.metalType,
        purity: p.purity,
        weight: p.weight,
        featured: p.featured,
        isBestseller: p.isBestseller,
        isNewArrival: p.isNewArrival,
        variantCount: p.variants.length,
      })),
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Admin products list error:", error);
    return NextResponse.json({ error: error.message || "Failed to load products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const {
      title,
      slug,
      price,
      originalPrice,
      description,
      categoryId,
      merchantId,
      mainImage,
      inStock,
      manufacturer,
      metalType,
      purity,
      weight,
      occasion,
      collection,
      featured,
      isBestseller,
      isNewArrival,
      variants,
    } = body;

    // Validate required fields
    if (!title || !slug || !price || !categoryId) {
      return NextResponse.json({ error: "Missing required fields (title, slug, price, categoryId)" }, { status: 400 });
    }

    // Default merchant fallback
    let actualMerchantId = merchantId;
    if (!actualMerchantId) {
      const defaultMerchant = await prisma.merchant.findFirst();
      if (!defaultMerchant) {
        const createdMerchant = await prisma.merchant.create({
          data: {
            name: "Vamika Luxe Flagship",
            email: "admin@vamika.com",
            status: "ACTIVE",
          },
        });
        actualMerchantId = createdMerchant.id;
      } else {
        actualMerchantId = defaultMerchant.id;
      }
    }

    const createdProduct = await prisma.product.create({
      data: {
        title,
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        price: parseInt(price),
        originalPrice: originalPrice ? parseInt(originalPrice) : null,
        description: description || "",
        categoryId,
        merchantId: actualMerchantId,
        mainImage: mainImage || "/placeholder.jpg",
        inStock: parseInt(inStock || 1),
        manufacturer: manufacturer || "Vamika Luxe",
        metalType: metalType || null,
        purity: purity || null,
        weight: weight ? parseFloat(weight) : null,
        occasion: occasion || null,
        collection: collection || null,
        featured: Boolean(featured),
        isBestseller: Boolean(isBestseller),
        isNewArrival: Boolean(isNewArrival),
      },
    });

    // Create variants if supplied
    if (Array.isArray(variants) && variants.length > 0) {
      for (const variant of variants) {
        if (variant.sku && variant.price) {
          await prisma.productVariant.create({
            data: {
              productId: createdProduct.id,
              sku: variant.sku,
              title: variant.title || `${title} - ${variant.sku}`,
              price: parseInt(variant.price),
              compareAtPrice: variant.compareAtPrice ? parseInt(variant.compareAtPrice) : null,
              stockQuantity: parseInt(variant.stockQuantity || 0),
              weight: variant.weight ? parseFloat(variant.weight) : null,
            },
          });
        }
      }
    }

    await recordAuditLog({
      actorId: (auth.user as any)?.id || "admin",
      action: "CREATE_PRODUCT",
      entityType: "PRODUCT",
      entityId: createdProduct.id,
      newValue: createdProduct,
    });

    return NextResponse.json({ success: true, product: createdProduct });
  } catch (error: any) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { productIds, action, value } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "No products selected" }, { status: 400 });
    }

    let updateData: any = {};
    if (action === "FEATURE") {
      updateData = { featured: Boolean(value) };
    } else if (action === "BESTSELLER") {
      updateData = { isBestseller: Boolean(value) };
    } else if (action === "UPDATE_STOCK") {
      updateData = { inStock: parseInt(value || 0) };
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: updateData,
    });

    await recordAuditLog({
      actorId: (auth.user as any)?.id || "admin",
      action: `BULK_UPDATE_PRODUCTS_${action}`,
      entityType: "PRODUCT",
      entityId: productIds.join(","),
      newValue: updateData,
    });

    return NextResponse.json({ success: true, updatedCount: result.count });
  } catch (error: any) {
    console.error("Bulk update product error:", error);
    return NextResponse.json({ error: error.message || "Failed to update products" }, { status: 500 });
  }
}
