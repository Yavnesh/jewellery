import { MetadataRoute } from 'next'
export const dynamic = 'force-dynamic';
import prisma from "@/utils/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.vamika.example.com'
  const locales = ['en', 'hi'];

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
    for (const locale of locales) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: page === '' ? 1.0 : 0.9,
      });
    }
  }

  // Generate localized Category URLs
  for (const category of categories) {
    for (const locale of locales) {
      const trans = category.translations.find(t => t.locale === locale);
      const catName = trans ? trans.name : category.name;
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/shop/${catName.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      });
    }
  }

  // Generate localized Product URLs
  for (const product of products) {
    for (const locale of locales) {
      const trans = product.translations.find(t => t.locale === locale);
      const slug = trans ? trans.slug : product.slug;
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/product/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      });
    }
  }

  return sitemapEntries;
}
