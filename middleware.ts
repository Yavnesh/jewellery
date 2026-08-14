import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames and redirect root/unlocalized pages
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for all requests under these paths
    '/(en|hi)/:path*',

    // Match all pathnames except for the ones starting with:
    // - api (API routes)
    // - _next (Next.js internals)
    // - _vercel (Vercel internals)
    // - static files (e.g. favicon.ico, images, robots.txt, sitemap.xml)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
