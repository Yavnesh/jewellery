# Volume 3: Identity, Security & Data
*Comprehensive E-Commerce Audit*

## 6. Authentication & 11. Customer Account

### Executive Summary
Authentication is currently handled by NextAuth.js using a manual Credentials Provider with basic bcrypt hashing. The customer account experience is highly disjointed due to aggressive session timeouts.

### Current State
- **Authentication:** NextAuth (Credentials).
- **Session Management:** JWT strategy with an extremely short lifespan (`maxAge: 15 * 60` / 15 minutes).
- **Customer Dashboard:** Does not persistently save preferences or order history effectively across sessions.

### Severe Production Issues
- **15-Minute Session Expiry:** In e-commerce, users often browse over several hours or days before making a high-ticket purchase (like luxury jewelry). Forcing a silent logout after 15 minutes guarantees massive cart abandonment.
- **Missing Social Logins:** No Google/Apple sign-in, which are proven to increase conversion rates by up to 20%.

### Recommendations
- Increase JWT `maxAge` to at least 30 days (`30 * 24 * 60 * 60`).
- Implement OAuth providers (Google, Apple, Facebook).
- **UX Score:** 2/10 (Aggressive timeouts destroy UX).

---

## 14. Security

### Executive Summary
The platform contains multiple critical vulnerabilities that would immediately fail a standard penetration test or PCI-DSS compliance audit.

### Current State
- **CSRF / XSS:** Relies entirely on Next.js defaults. No custom Content Security Policy (CSP) headers are defined.
- **Rate Limiting:** Non-existent.

### Critical Vulnerabilities
1. **Broken Object Level Authorization (BOLA) / Price Manipulation:** The `/checkout` flow blindly trusts the `total` price sent from the client's `sessionStorage`. An attacker can manipulate their local storage to set `total = 1` and purchase any item for $1.
2. **Missing Rate Limiting:** The `/api/auth` endpoints are not rate-limited, leaving the platform highly vulnerable to credential stuffing and brute-force attacks.
3. **Missing WAF & Bot Protection:** Without Cloudflare or AWS WAF, the site is exposed to scrapers stealing the catalog and DDoS attacks.

### Recommendations
- **Server-Side Validation:** The API MUST recalculate order totals by fetching product prices directly from the database based on the `productId`. NEVER trust client-supplied totals.
- Implement Upstash Redis Rate Limiting on all `/api/*` routes.
- Implement strict CSP Headers via `next.config.js`.
- **Security Score:** 1/10 (Extremely High Risk).

---

## 18. APIs

### Executive Summary
The API architecture is heavily fragmented and relies on a mix of Next.js Server Components, internal API routes (`/api/auth`), and external/decoupled API calls (`http://localhost:3001`).

### Current State
- **Architecture:** REST-like calls using a custom `apiClient`.
- **Error Handling:** Inconsistent. The client often crashes or fails silently if an API returns a 500 error instead of a graceful JSON error message.

### Weaknesses
- **Hardcoded Endpoints:** `config.apiBaseUrl` defaults to `localhost:3001`, suggesting a decoupled backend that may or may not be correctly deployed alongside the Next.js frontend.
- **Pagination & Filtering:** Currently implemented directly via Prisma in Server Components, bypassing formal API layers, which is fast but leads to tightly coupled UI and data layers.

### Recommendations
- Standardize all data fetching to use Next.js Server Actions or dedicated internal Route Handlers (`app/api/...`) instead of bouncing out to an external `localhost:3001` service.
- **Maintainability Score:** 4/10.

---

## 20. Database

### Executive Summary
The database utilizes MySQL via Prisma. The schema is highly normalized but lacks critical indexing for performance at scale.

### Current State
- **Schema:** 9 Models (`Product`, `Category`, `User`, `Customer_order`, etc.).
- **Relations:** Correctly utilizes Foreign Keys and Cascade deletions.

### Weaknesses & Missing Indexes
- **Missing Indexes:** The `Product` model lacks indexes on heavily queried fields like `categoryId`, `price`, `collection`, and `occasion`.
- **Data Integrity:** The `Customer_order` model stores `total` as an `Int`, but fails to lock in historical prices. If a product price changes in the `Product` table, it is unclear if the line-item history is preserved correctly without a snapshot.

### Recommendations
- Add `@@index([categoryId])`, `@@index([price])`, and `@@index([collection])` to the `Product` model in `schema.prisma`.
- Implement a `OrderLineItem` snapshot that hardcodes the `priceAtPurchase` to prevent historical data corruption if product prices change later.
- **Scalability Score:** 6/10.
