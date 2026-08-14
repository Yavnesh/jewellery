import prisma from "@/utils/db";
import { unstable_cache } from "next/cache";

export const getProductBySlug = async (slug: string, locale: string = "en") => {
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug },
        { translations: { some: { slug, locale } } }
      ]
    },
    include: {
      category: {
        include: { translations: { where: { locale } } }
      },
      translations: {
        where: { locale }
      },
      options: {
        include: {
          values: { orderBy: { position: 'asc' } }
        },
        orderBy: { position: 'asc' }
      },
      variants: {
        where: { status: 'ACTIVE' },
        include: {
          optionValues: {
            include: { optionValue: { include: { option: true } } }
          }
        },
        orderBy: { position: 'asc' }
      }
    }
  });

  if (!product) return null;

  const activeTrans = product.translations[0];
  const catTrans = product.category?.translations[0];

  return {
    ...product,
    title: activeTrans ? activeTrans.title : product.title,
    description: activeTrans ? activeTrans.description : product.description,
    slug: activeTrans ? activeTrans.slug : product.slug,
    category: product.category ? {
      ...product.category,
      name: catTrans ? catTrans.name : product.category.name
    } : null
  };
};

export const getProductImages = (productId: string) => {
  return unstable_cache(
    async () => {
      return prisma.image.findMany({
        where: { productID: productId }
      });
    },
    ['product-images', productId],
    { tags: ['products', 'images'] }
  )();
};

export const getProducts = async (where: any, skip: number, limit: number, sort: string, locale: string = "en") => {
  const products = await prisma.product.findMany({
    where,
    skip,
    take: limit,
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
    },
    orderBy: sort === 'price-asc' ? { price: 'asc' } :
             sort === 'price-desc' ? { price: 'desc' } :
             { id: 'desc' }
  });
  
  const localizedProducts = products.map(prod => {
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

  const totalProducts = await prisma.product.count({ where });
  
  return { products: localizedProducts, totalProducts };
};
