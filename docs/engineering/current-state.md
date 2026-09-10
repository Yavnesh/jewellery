# Current Engineering State

## Runtime
- **Next.js**: 15+ (from build logs showing Promise resolution for cookies)
- **Node.js**: Expected v22+
- **Package manager**: npm (and bun locks exist)

## Database
- **Provider**: MySQL
- **ORM**: Prisma
- **Connection strategy**: Currently unbounded/basic Prisma Client instantiation in Next.js backend, lacking formal connection pool protection like Prisma Accelerate or PgBouncer-equivalent for MySQL.

## Deployment
- **Current provider**: Vercel (based on previously mentioned Vercel -> AWS roadmap and next.config setups)
- **Build command**: `npm run build`
- **Start command**: `npm run start`

## Critical business flows
1. Product discovery
2. Product detail
3. Add to cart
4. Checkout
5. Payment
6. Order creation
7. Order confirmation

## Current engineering gaps
- **No automated tests**: Vitest/Playwright are not configured yet.
- **No CI pipeline**: GitHub actions are missing.
- **No structured logging**: Application uses `console.log` and `console.error`.
- **No production error tracking**: Sentry is installed but lacks business context.
- **No health endpoint**: No `/api/health` probes are available.
- **TypeScript Errors**: Some exist around cookies (Promise API), missing `updatedAt` properties in `sitemap.ts`, and `dataLayer` type on `window`.

## Execution Notes
This documentation fulfills Phase 0 (Step 0.1 and Step 0.2). Existing failures were recorded before remediation (Step 0.3).
