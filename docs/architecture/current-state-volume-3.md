# Current Architecture (Volume 3 Baseline)

## Authentication
- **Auth library and version:** NextAuth.js (`next-auth@4.24.11`)
- **Providers:** Only `CredentialsProvider` is currently implemented (email/password).
- **Session strategy:** JWT.
- **Session duration:** Currently set to 15 minutes (`maxAge: 15 * 60`).
- **Cookie configuration:** Default NextAuth cookies (not explicitly customized).

## Authorization
- **Existing roles:** Users have a `role` field (defaulting to "user"). 
- **Existing ownership checks:** Inconsistent. Many legacy API routes accept payloads directly from the client without checking if the user owns the data.
- **Protected routes:** Minimal middleware checks; some `getServerSession` calls exist in UI components, but robust server-side role validation is missing.

## API Architecture
- **Route Handlers:** Standard Next.js App Router API routes (`app/api/...`). Many are large and contain direct Prisma logic.
- **Server Actions:** We recently introduced `app/actions/cart.actions.ts` and `checkout.actions.ts`, establishing a pattern for thin actions calling domain services.
- **External API dependencies:** None explicitly required, though legacy code has traces of `localhost:3001` referring to an obsolete Express backend (`server/` folder).
- **API client usage:** `apiClient` wrapper around `fetch` used in legacy components.

## Database
- **Models:** `User`, `Category`, `Product`, `ProductVariant`, `Cart`, `Customer_order`, `InventoryEvent`, etc.
- **Important relations:** `Customer_order` -> `customer_order_product` -> `ProductVariant`.
- **Existing indexes:** Some composite indexes were recently added (e.g. `@@index([status])`), but optimization is generally lacking for customer account queries.
- **Existing constraints:** Minimal unique constraints.

## Security
- **Current security headers:** Missing. No explicit `next.config.js` headers defined.
- **CSP status:** Missing. No Content Security Policy implemented.
- **Rate limiting status:** An `express-rate-limit` package is in `package.json`, but this applies to the obsolete express backend. Next.js API routes are completely un-rate-limited.
- **Existing validation:** Little to no Zod validation. Most APIs just check `if (!req.body.name)`.

## Risks
- **Critical:** 
  - Lack of rate limiting on login/registration/checkout opens the site up to credential stuffing and DDoS.
  - BOLA (Broken Object Level Authorization): Users can potentially modify or query orders that don't belong to them in legacy APIs.
- **High:** 
  - Short session duration (15m) creates severe user friction and cart abandonment.
  - No Content Security Policy (XSS risk).
- **Medium:** 
  - Legacy Express API codebase (`server/`) is still in the repo but unused, causing confusion.
- **Low:** 
  - Prisma client initialized correctly in `utils/db.ts`, but connection pooling (like Prisma Accelerate) is absent.
