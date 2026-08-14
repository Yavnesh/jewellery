import { NextResponse } from "next/server";
import prisma from "@/utils/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const locale = searchParams.get("locale") || "en";

    // Search by default product title/description OR localized translations matching the query
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          {
            translations: {
              some: {
                OR: [
                  { title: { contains: query } },
                  { description: { contains: query } }
                ]
              }
            }
          }
        ]
      },
      select: {
        id: true,
        slug: true,
        title: true,
        price: true,
        originalPrice: true,
        mainImage: true,
        rating: true,
        inStock: true,
        category: {
          select: {
            name: true,
            translations: {
              where: { locale }
            }
          }
        },
        translations: {
          where: { locale }
        }
      }
    });

    const localizedProducts = products.map((prod) => {
      const activeTrans = prod.translations[0];
      const catTrans = prod.category?.translations[0];
      return {
        ...prod,
        title: activeTrans ? activeTrans.title : prod.title,
        slug: activeTrans ? activeTrans.slug : prod.slug,
        category: prod.category ? {
          name: catTrans ? catTrans.name : prod.category.name
        } : undefined
      };
    });

    return NextResponse.json(localizedProducts);
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
