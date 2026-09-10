# Volume 4 Baseline

## Performance

### Current Rendering
- **Static routes:** Some static marketing pages like the homepage, but currently they lack strong cache headers.
- **Dynamic routes:** `/app/shop/[[...slug]]/page.tsx` uses `export const dynamic = "force-dynamic"; export const revalidate = 0;`. This means the shop page does not cache *any* catalog queries and hits the DB on every single request.
- **Server-rendered routes:** `app/product/[slug]` (assuming exists) and `app/shop` execute direct Prisma queries in the page component.
- **Client-rendered routes:** 66 components contain `"use client"`. Many large components potentially have client boundaries.

### JavaScript
- **Largest client bundles:** `framer-motion`, `react-apexcharts`, `svgmap`, `react-slick`, `@headlessui/react` are all present in `package.json`. 
- **Client-only dependencies:** `svgmap` CSS is currently imported globally in `app/layout.tsx`.
- **Heavy dependencies:** `framer-motion` and `react-slick` are large and should be optimized or dynamic-imported.
- **Unnecessary client boundaries:** To be thoroughly audited in Phase 1, but many components use `useState` or `useEffect` for basic data fetching.

### Images
- **Source formats:** Unknown (likely a mix of JPG/PNG).
- **Rendered formats:** Next.js Image component is used, but exact formats in `next.config.js` aren't strictly defined for `avif`.
- **Image dimensions:** Hardcoded values or `fill` used loosely.
- **Missing sizes attributes:** Likely missing responsive `sizes` on product cards, defaulting to `100vw`.
- **LCP image behavior:** Eager loading and `priority` tags are not consistently applied to the LCP hero image.

### Database
- **Frequently repeated catalog queries:** `app/shop/[[...slug]]` performs Prisma `.findMany()` and `.count()` on every single page load with `revalidate = 0`. This is a massive bottleneck.
- **Current caching:** None for the catalog domain.
- **Query timing:** `findMany` queries lack explicit pagination optimization beyond simple `skip`/`take`.

### Core Web Vitals
*(Measurements to be taken in Step 0.2 via Lighthouse/DevTools)*
- **LCP:** Unknown (Goal: ≤ 2.5s)
- **INP:** Unknown (Goal: ≤ 200ms)
- **CLS:** Unknown (Goal: ≤ 0.1)
- **TTFB:** Unknown (Goal: ≤ 800ms)

## SEO

- **Existing metadata:** Static metadata in `app/layout.tsx`. Dynamic metadata for products/categories is missing.
- **Dynamic metadata coverage:** Poor.
- **Canonical coverage:** Missing. 
- **Sitemap status:** Missing.
- **Robots status:** Missing.
- **Structured-data status:** Missing (No JSON-LD).
- **Indexation risks:** Filter parameters on `/shop` (e.g., `?collections=bridal&purities=18k`) will create crawler traps and duplicate content.

## Accessibility

- **Keyboard issues:** Minimal focus management.
- **Focus-management issues:** Drawers/Modals don't consistently trap focus.
- **Contrast failures:** Some gray text (`text-gray-400`) on white backgrounds fails AA contrast.
- **Missing labels:** Icon buttons lack `aria-label`.
- **Invalid ARIA:** Unknown, likely missing.
- **Image-alt issues:** Product images often just have `alt="product image"`.

## Analytics

- **Existing tools:** `GoogleAnalytics` component loaded statically in `app/layout.tsx`.
- **Existing events:** Missing e-commerce events (`view_item`, `add_to_cart`, `purchase`).
- **Conversion visibility:** None.
- **Consent status:** `CookieConsentBanner` exists but it is unclear if it blocks GA initialization correctly.

## Prioritized Risks

### Critical
- **DB Overload:** The Shop page is `force-dynamic` with no caching, hitting the database on every filter and pagination click.
- **Crawler Traps:** Unlimited filter combinations on `/shop` are indexable.
- **Missing SEO:** No dynamic metadata, sitemap, or robots.txt.

### High
- **Bundle Size:** Global imports of map CSS and chart libraries.
- **Analytics:** E-commerce funnel is completely unmeasured.

### Medium
- **Image Optimization:** Missing `sizes` attributes causing over-downloading on mobile.
- **Accessibility:** Poor contrast and missing `aria-label`s.

### Low
- **Framer Motion:** Can be optimized to reduce initial JS payload.
