import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.tanishq.example.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/cart', '/checkout', '/account', '/api', '/admin', '/login'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
