# CTO Implementation Plan: End-to-End Remediation & Modernization

**Plan Creation Date:** 2026-10-18  
**Author / Perspective:** Chief Technology Officer (CTO)  
**Governing Documents:**  
- Framework: [2026-10-18-cto-audit-execution-framework.md](file:///Users/yavnesh/Workplace/jewellery/docs/audits/2026-10-18-cto-audit-execution-framework.md)  
- Audit Findings: [2026-10-18-cto-audit-findings.md](file:///Users/yavnesh/Workplace/jewellery/docs/audits/2026-10-18-cto-audit-findings.md)  
**Target Repository:** Vamika Jewels E-Commerce Platform (`jewellery`)  

---

## 1. Master Implementation Strategy

This implementation plan translates the seven audit workstreams into a sequenced, risk-managed execution roadmap. 

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: 48-Hour Critical Security & Financial Hardening (P0)          │
│ • Lock down PII leak in public orders API                              │
│ • Secure background cron endpoints with CRON_SECRET middleware         │
│ • Eliminate insecure dummy webhook handler in production               │
│ • Purge raw database manipulation scripts from workspace root          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Phase 2: 7-Day Operational Stabilization & Reliability (P1)            │
│ • Build the Admin Observability & System Health Center (/admin/health) │
│ • Consolidate duplicate admin order components & clean import trees    │
│ • Implement active 10-minute cart inventory reservation locking        │
│ • Wire Twilio SMS / WhatsApp shipping notification triggers            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Phase 3: 30-Day Core Commerce Maturity & Single-Operator Autonomy (P2) │
│ • Storefront Customer Self-Service RMA / Return Portal                 │
│ • Dynamic GST Tax Invoice PDF generation & download engine             │
│ • Multi-faceted Luxury Jewellery Search (Karat, Clarity, Cut, Weight)   │
│ • Automated Payment Gateway Settlement Reconciliation Daemon           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Phase 4: 90-Day Enterprise Scalability & Global Readiness (P3)         │
│ • International Multi-Currency Checkout (Skydo USD/EUR Stripe Fallback)│
│ • Read-Replica DB connection pooling with Prisma Accelerate            │
│ • Automated Armored Carrier API Dispatch (Shiprocket / BlueDart Apex)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: 48-Hour Critical Security & Financial Hardening (P0)

*Objective: Neutralize immediate data breach risks, prevent unauthorized cron invocations, and protect payment integrity before any customer transactions occur.*

### Step 1.1: Secure the Public Orders API (SEC-01)
- **Problem & Root Cause:**  
  [app/api/orders/route.ts](file:///Users/yavnesh/Workplace/jewellery/app/api/orders/route.ts) exposes full customer names, phone numbers, email addresses, street addresses, and order amounts with zero authentication to any caller.
- **Implementation Action:**
  1. Inspect caller trees. The only internal caller was the legacy `components/AdminOrders.tsx` (which is being replaced).
  2. Transform `/api/orders/route.ts` into a customer-scoped session endpoint:
     - Check `const session = await getServerSession(authOptions)`.
     - If unauthenticated, return `401 Unauthorized`.
     - Filter strictly by the authenticated user's ID: `where: { userId: session.user.id }`.
  3. Ensure admin users fetching all orders use the fully secured, RBAC-protected [app/api/admin/orders/route.ts](file:///Users/yavnesh/Workplace/jewellery/app/api/admin/orders/route.ts).
- **Verification & Acceptance Test:**
  - `curl -X GET http://localhost:3000/api/orders` returns `401 Unauthorized`.
  - Authenticated regular customer only receives orders linked to their own account.

---

### Step 1.2: Enforce `CRON_SECRET` Middleware on All Background Crons (SEC-02)
- **Problem & Root Cause:**  
  Crons under `app/api/cron/` (`reconcile-payments`, `process-outbox`, `process-webhooks`, `release-reservations`) can be executed or flooded via public HTTP GET requests.
- **Implementation Action:**
  1. Create a centralized cron authentication helper in `lib/auth/cronAuth.ts`:
     ```ts
     import { headers } from "next/headers";
     export async function verifyCronSecret(request: Request): Promise<boolean> {
       const authHeader = request.headers.get("authorization");
       const cronSecret = process.env.CRON_SECRET;
       if (!cronSecret) return process.env.NODE_ENV !== "production";
       return authHeader === `Bearer ${cronSecret}`;
     }
     ```
  2. Guard all cron routes with this helper, immediately returning `401 Unauthorized` on mismatch.
  3. Document the `CRON_SECRET` variable in `.env.example`.
- **Verification & Acceptance Test:**
  - `curl -X GET http://localhost:3000/api/cron/process-outbox` returns `401 Unauthorized`.
  - `curl -H "Authorization: Bearer <VALID_SECRET>" http://localhost:3000/api/cron/process-outbox` returns `200 OK`.

---

### Step 1.3: Decommission the Insecure Mock Payment Webhook (SEC-03)
- **Problem & Root Cause:**  
  [app/api/webhooks/payment/route.ts](file:///Users/yavnesh/Workplace/jewellery/app/api/webhooks/payment/route.ts) utilizes `DummyPaymentProvider` which bypasses real cryptographic HMAC signatures and writes unverified events to `IncomingWebhookEvent`.
- **Implementation Action:**
  1. Verify all production traffic routes to the signature-verified [app/api/webhooks/razorpay/route.ts](file:///Users/yavnesh/Workplace/jewellery/app/api/webhooks/razorpay/route.ts) or the modular carrier webhook [app/api/webhooks/shipping/[provider]/route.ts](file:///Users/yavnesh/Workplace/jewellery/app/api/webhooks/shipping/[provider]/route.ts). The modular carrier should be designed in such a way that multiple providers can be implemented like skydo, stripe etc but currently in production we only want razorpay as the payment option, and all other should not be available to user untill implemented and tested as they are for future implementation. 
  2. Remove or restrict `/api/webhooks/payment/route.ts` so it is completely disabled in production environments (`if (process.env.NODE_ENV === 'production') return 404`).
- **Verification & Acceptance Test:**
  - Sending forged payload to `/api/webhooks/payment` in production returns `404 Not Found`.
  - Razorpay webhooks continue to verify HMAC-SHA256 signatures in `razorpay/route.ts`.

---

### Step 1.4: Workspace Root Hygiene & Script Containment (SEC-04 / SEC-05)
- **Problem & Root Cause:**  
  Standalone diagnostic scripts (`check_payment.ts`, `check_stock.ts`, `reset_stock.ts`, `replace_tanishq.js`, `test_prisma.ts`) reside in the root repository.
- **Implementation Action:**
  1. Relocate diagnostic scripts into `scripts/diagnostics/`.
  2. Move `scratch/` artifacts and sensitive keys out of the active webroot.
  3. Verify `.gitignore` rules prevent accidentally committing credentials or test logs.
- **Verification & Acceptance Test:**
  - Root directory contains only clean Next.js/Docker project configuration files.
  - TypeScript build (`npm run lint` / `tsc --noEmit`) passes cleanly.

---

## Phase 2: 7-Day Operational Stabilization & Reliability (P1)

*Objective: Provide the single operator with full system visibility, eliminate code duplication, and implement active cart stock reservations to prevent overselling high-ticket jewellery pieces.*

### Step 2.1: Build the Admin Observability & System Health Center
- **Why It's Critical:**  
  A single operator cannot inspect Docker logs or server consoles when an email fails or a payment webhook is stuck. The admin must have an operational dashboard.
- **Implementation Action:**
  1. Create an admin health API route `app/api/admin/observability/route.ts`:
     - Checks database query latency and connection pool status.
     - Counts pending vs failed `OutboxEvent` records.
     - Counts unprocessed vs failed `IncomingWebhookEvent` records.
     - Reports latest backup timestamp and active environment details.
  2. Create the Admin Health & Telemetry page `app/[locale]/(dashboard)/admin/observability/page.tsx`:
     - Visual status cards: Database Health, Outbox Queue Depth, Webhook Processing Engine, Error Rates.
     - One-click "Retry Failed Outbox Events" and "Re-queue Webhook" action buttons with audit logging.
  3. Register "Observability & System Health" in `components/admin/AdminSidebar.tsx`.
- **Verification & Acceptance Test:**
  - Single operator navigates to `/admin/observability` and views real-time metrics with zero manual terminal commands.

---

### Step 2.2: Consolidate Redundant Order Components (DUP-01)
- **Problem & Root Cause:**  
  `components/AdminOrders.tsx` is an obsolete prototype that queries the unauthenticated `/api/orders` route, whereas `app/[locale]/(dashboard)/admin/orders/page.tsx` is the enterprise-grade order management interface.
- **Implementation Action:**
  1. Remove `components/AdminOrders.tsx`.
  2. Remove the export from `components/index.ts`.
  3. Confirm that all admin order management flows route through the unified `AdminOrdersPage`.
- **Verification & Acceptance Test:**
  - Zero references to `AdminOrders.tsx` across the codebase.
  - `/admin/orders` functions with search, multi-tier filters, export, and logistics tracking.

---

### Step 2.3: Implement Active 10-Minute Cart Inventory Reservations
- **Why It's Critical:**  
  In luxury jewellery, items are frequently unique, one-of-a-kind (solitaires, custom sizes). If two customers checkout simultaneously without temporary stock locks, overselling occurs.
- **Implementation Action:**
  1. In `src/modules/checkout/application/checkout.service.ts`:
     - When a customer enters checkout, atomically increment `ProductVariant.reservedQuantity`.
     - Log an `InventoryEvent` of type `RESERVATION`.
  2. Ensure the background cron `app/api/cron/release-reservations/route.ts` runs every 5 minutes to release reservations on carts expired over 15 minutes.
  3. Display a countdown timer banner on the checkout page ("Stock held for 15:00 minutes").
- **Verification & Acceptance Test:**
  - Reserving the last available piece increments `reservedQuantity` and marks it unavailable to competing sessions.
  - After 15 minutes of inactivity, the cron automatically releases the hold and restores available inventory.

---

### Step 2.4: Wire Twilio SMS / WhatsApp Shipping Notification Triggers
- **Why It's Critical:**  
  High-value jewellery buyers in India require immediate SMS/WhatsApp communication upon dispatch, out-for-delivery, and delivery.
- **Implementation Action:**
  1. Complete the implementation specified in `docs/future_implementations/twilio_setup.md`.
  2. Wire the Twilio SMS adapter into `src/modules/notifications/outbox.worker.ts` for:
     - `ORDER_SHIPPED` (Includes carrier name and tracking URL).
     - `OUT_FOR_DELIVERY` (Includes delivery PIN requirement).
     - `DELIVERED` (Includes confirmation and care instructions link).
- **Verification & Acceptance Test:**
  - Status updates in `/admin/orders` or via carrier webhooks automatically enqueue SMS outbox records and dispatch via Twilio.

---

## Phase 3: 30-Day Core Commerce Maturity (P2)

*Objective: Deliver luxury jewellery customer self-service, automated financial reporting, and advanced product discovery.*

### Step 3.1: Customer Self-Service Return & Exchange Portal (RMA)
- **Implementation Action:**
  1. Build a customer-facing return initiation modal in `app/[locale]/account/orders/[id]/page.tsx`.
  2. Allow customers to select return reason (e.g., "Size mismatch", "Inspection guarantee"), upload unboxing photos, and request pickup.
  3. Auto-generate an `OrderReturn` record linking to the shipment and notify the admin dashboard's Returns & RMA queue.
- **Verification & Acceptance Test:**
  - Customer submits return request from their order history; request immediately appears in `/admin/returns` for admin approval.

---

### Step 3.2: Automated GST Tax Invoice Generation & Customer Download
- **Implementation Action:**
  1. Implement a server-side invoice generator (using React-PDF or `@react-email`) that adheres to Indian GST rules:
     - Includes Vamika Jewels GSTIN, State Code, HSN Code (7113 for precious jewellery).
     - Separates CGST (1.5%) + SGST (1.5%) for intra-state or IGST (3%) for inter-state orders.
     - Displays Hallmarking / BIS certification declaration.
  2. Provide a "Download Tax Invoice" button on both the customer order page and admin order detail view.
- **Verification & Acceptance Test:**
  - Generated PDF precisely matches total billed amounts, GST tax breakdowns, and legal business identifiers.

---

### Step 3.3: Faceted Jewellery Search & Merchandising Engine
- **Implementation Action:**
  1. Upgrade `/api/products` and storefront filter bars to support faceted search:
     - **Metal & Purity:** 14K Gold, 18K Yellow Gold, 18K Rose Gold, 950 Platinum, 925 Silver.
     - **Diamond Carat Weight:** Sliders and ranges (0.5ct – 1.0ct, 1.0ct – 2.0ct+).
     - **Price & Occasion:** Bridal, Daily Wear, Cocktail, Festive.
  2. Add sorting by popularity, price ascending/descending, and verified stock availability.
- **Verification & Acceptance Test:**
  - Storefront catalog filters items accurately in real-time without reloading the entire page.

---

### Step 3.4: Automated Gateway Settlement Reconciliation Daemon
- **Implementation Action:**
  1. Upgrade `app/api/cron/reconcile-payments/route.ts` from mock checks to live Razorpay Settlement API queries.
  2. Match daily gateway payouts against customer orders, flagging transaction fees, disputed charges, and unlinked payments.
  3. Present reconciliation summaries in the Admin Payments view.
- **Verification & Acceptance Test:**
  - System automatically identifies orders where the customer card was charged but the browser window was closed before the redirect completed.

---

## Phase 4: 90-Day Scalability & Global Readiness (P3)

*Objective: Scale infrastructure to support high concurrency, global sales, and automated carrier dispatch.*

### Step 4.1: Skydo Multi-Currency International Checkout
- **Implementation Action:**
  1. Complete the Skydo payment adapter in `src/modules/payments/infrastructure/skydo/`.
  - we do not have the api key as of now for skydo, so implement but it should not impact the current payment workflow
  2. Support foreign currency billing (USD, EUR, GBP, AED) with automated currency conversion and export compliance declarations.
- **Verification & Acceptance Test:**
  - International customer checking out in USD completes payment through Skydo with full webhook verification.

---

### Step 4.2: Read-Replica Pooling & Performance Optimization
- **Implementation Action:**
  1. Connect Prisma to a read-replica pool (or Prisma Accelerate) for read-heavy public catalog queries.
  2. Implement Redis-backed caching (Upstash) for static taxonomies, category trees, and product metadata.
- **Verification & Acceptance Test:**
  - Storefront homepage and catalog response times remain under 100ms under load testing.

---

### Step 4.3: Automated Armored Logistics Dispatch
- **Implementation Action:**
  1. Integrate direct API booking with BlueDart Apex / Shiprocket Armored Services.
  2. Single-click "Generate Armored AWB & Schedule Manifest" button in `/admin/orders/[id]`.
- **Verification & Acceptance Test:**
  - Admin clicks one button; carrier AWB is generated, shipping label is printed, and courier pickup manifest is created automatically.

---

## 2. Risk Matrix & Rollback Contingencies

| Action | Potential Failure Risk | Mitigation / Fallback Strategy |
| :--- | :--- | :--- |
| **Securing `/api/orders`** | Inadvertently breaking customer profile views | Thoroughly test user session scoping; confirm customer order history calls `/api/customer/orders` or uses session filtering. |
| **Enforcing `CRON_SECRET`** | Background jobs failing if cron runner lacks header | Set fallback in staging environment; ensure Vercel Cron or GitHub Actions secret is configured before production enforcement. |
| **Inventory Reservation** | Carts locking stock and preventing other sales | Enforce strict 15-minute timeout with automated release daemon; provide visible countdown clock to user. |
| **Removing duplicate files** | Unresolved import errors crashing the build | Run AST grep and full build check (`next build` / `tsc --noEmit`) before committing any deletion. |

---

## 3. Immediate Recommended Next Action

The implementation plan is structured for safe, incremental execution. 

**Recommended immediate step:**  
Execute **Phase 1 (48-Hour P0 Security Hardening)**:
1. Secure `/api/orders` by enforcing user session ownership.
2. Add `verifyCronSecret` to the cron endpoints.
3. Remove test payment provider routes.
4. Clean diagnostic root scripts.
