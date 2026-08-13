import prisma from "@/utils/db";
import { unstable_cache } from "next/cache";

export const getProductBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
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
  },
  ['product-by-slug'],
  { tags: ['products'] }
);

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

export const getProducts = (where: any, skip: number, limit: number, sort: string) => {
  return unstable_cache(
    async () => {
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
            select: { name: true }
          }
        },
        orderBy: sort === 'price-asc' ? { price: 'asc' } :
                 sort === 'price-desc' ? { price: 'desc' } :
                 { id: 'desc' }
      });
      
      const totalProducts = await prisma.product.count({ where });
      
      return { products, totalProducts };
    },
    ['products-list', JSON.stringify(where), String(skip), String(limit), sort],
    { tags: ['products'] }
  )();
};
