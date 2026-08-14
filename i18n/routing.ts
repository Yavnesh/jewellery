import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'hi', 'es', 'fr', 'de', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'always' // Ensures all URLs have the prefix
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
