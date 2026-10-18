import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - api (API routes)
  // - _next (Next.js internals)
  // - _vercel (Vercel internals)
  // - static files (e.g. favicon.ico, images, robots.txt, sitemap.xml)
  matcher: [
    '/',
    '/(en|hi|ar|es|fr|de)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
