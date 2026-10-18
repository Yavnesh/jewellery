import { MetadataRoute } from 'next'
export const dynamic = 'force-dynamic';
import prisma from "@/utils/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.vamika.example.com';

  // Fetch all products with translations
  const products = await prisma.product.findMany({
    select: {
      slug: true,
      translations: {
        select: {
          locale: true,
          slug: true
        }
      }
    }
  });

  // Fetch all categories with translations
  const categories = await prisma.category.findMany({
    select: {
      name: true,
      translations: {
        select: {
          locale: true,
          name: true
        }
      }
    }
  });

  const staticPages = ['', '/shop'];
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate static pages sitemap
  for (const page of staticPages) {
    sitemapEntries.push({
      url: `${baseUrl}${page}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: page === '' ? 1.0 : 0.9,
    });
  }

  // Generate Category URLs
  for (const category of categories) {
    sitemapEntries.push({
      url: `${baseUrl}/shop/${category.name.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    });
  }

  // Generate Product URLs
  for (const product of products) {
    sitemapEntries.push({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    });
  }

  return sitemapEntries;
}
