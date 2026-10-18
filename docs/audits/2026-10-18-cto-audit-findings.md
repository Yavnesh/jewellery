# CTO Audit Execution: Technical & Operational Findings

**Audit Execution Date:** 2026-10-18  
**Auditor:** Chief Technology Officer (CTO perspective)  
**Target Repository:** Vamika Jewels E-Commerce Platform (`jewellery`)  
**Status:** Discovery & Operational Audit Completed (Read-Only; Zero Code Modifications)  
**Governing Framework:** [2026-10-18-cto-audit-execution-framework.md](file:///Users/yavnesh/Workplace/jewellery/docs/audits/2026-10-18-cto-audit-execution-framework.md)

---

## 1. Executive Summary & Production-Readiness Assessment

| Dimension | Rating | Status | Summary Assessment |
| :--- | :---: | :---: | :--- |
| **Architecture Modernity** | **4/5** | 🟢 Solid | Next.js 16 (App Router), Prisma 6 with MySQL, layered domain modularity in `src/modules/{checkout,payments,logistics,catalog,notifications}`. |
| **Financial & Payment Integrity** | **3.5/5** | 🟡 Acceptable | Razorpay/Skydo adapters implemented with idempotency keys; webhook queueing via `IncomingWebhookEvent` and `PaymentEvent`. **Critical gap:** multiple competing webhook entrypoints (`/api/webhooks/razorpay` vs `/api/webhooks/payment`). |
| **Customer Experience & Trust** | **3/5** | 🟡 Incomplete | Jewel-specific attributes (purity, metal, weight, carat) modeled in Prisma, but luxury filter bar, real-time cart reservations, and certificate download flows require end-to-end integration. |
| **Single-Operator Admin Sufficiency** | **3/5** | 🟡 Partial | Robust order management, shipping tracking with BlueDart/DHL, inventory adjustments, and audit logs exist. **Missing:** Observability tab, automated payment reconciliation UI, carrier exception resolution workflow, automated invoice generator. |
| **Security & Access Control** | **2.5/5** | 🔴 High Risk | **Critical P0:** Public unauthenticated endpoint exposing order PII (`/api/orders`), unauthenticated mock payment endpoint (`/api/webhooks/payment`), and obsolete legacy root scripts. |
| **Observability & Reliability** | **2/5** | 🔴 Inadequate | Sentry and Datadog libraries installed, `/api/health/ready` database ping exists, but no operational observability dashboard, no alerts configured for payment failure spikes, and background crons rely on unauthenticated GET routes. |
| **Code Duplication & Hygiene** | **2.5/5** | 🟡 Needs Cleanup | Competing checkout calculation files, dual webhook routes, and dangling root scripts (`check_payment.ts`, `check_stock.ts`, `reset_stock.ts`, `replace_tanishq.js`). |

**Overall Production-Readiness Verdict:** **CONDITIONAL HOLD (NOT READY FOR UNATTENDED LAUNCH)**  
*Before opening commercial transactions, 3 P0 vulnerabilities (public orders API, dual webhook endpoints, unauthenticated crons) must be remediated.*

---

## 2. Workstream A: Codebase & Architecture Topology

```
                  ┌──────────────────────────────────────────────┐
                  │          Storefront & Client Layer           │
                  │   Next.js 16 App Router (React 18 + SSR)    │
                  └───────────────┬──────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js API & Route Layer                       │
│  ├─ Storefront APIs: /api/checkout, /api/products, /api/customer       │
│  ├─ Webhooks: /api/webhooks/{razorpay, shipping, skydo, payment}       │
│  ├─ Cron Jobs: /api/cron/{process-outbox, reconcile-payments, etc.}    │
│  └─ Admin APIs: /api/admin/{orders, inventory, database, shipments}    │
└───────────────┬────────────────────────────────┬───────────────────────┘
                │                                │
                ▼                                ▼
┌───────────────────────────────┐  ┌─────────────────────────────────────┐
│ Domain Modules (src/modules/) │  │     Legacy Utility Layer (lib/)     │
│ ├─ checkout/application       │  │ ├─ adminAuthHelper.ts (Session RBAC)│
│ ├─ payments/infrastructure    │  │ ├─ elevatedAuthHelper.ts (Dual-tier)│
│ ├─ logistics/application      │  │ ├─ logger.ts (Pino structured log)  │
│ └─ notifications/             │  │ └─ apiClient.ts (Legacy fetch)      │
└───────────────┬───────────────┘  └─────────────────┬───────────────────┘
                │                                    │
                └─────────────────┬──────────────────┘
                                  │
                                  ▼
               ┌─────────────────────────────────────┐
               │    Data Persistence: Prisma ORM     │
               │    Engine: MySQL (Host/Accelerate)  │
               │    1,026 Lines across 28 Models     │
               └─────────────────────────────────────┘
```

### Module & Dependency Inventory

1. **Core Framework:** Next.js 16.2.11, React 18.3.1, TypeScript 5.9.2, TailwindCSS 3.3.0.
2. **Database & Data Layer:** Prisma Client 6.16.1 over MySQL. Advanced models: `ProductVariant`, `VariantOptionValue`, `InventoryEvent`, `Customer_order`, `OrderShipment`, `ShipmentTrackingEvent`, `Payment`, `PaymentEvent`, `OutboxEvent`, `AuditLog`.
3. **Authentication:** NextAuth 4.24.11 with JWT strategy, bcryptjs password hashing, and dual-tier elevated session authorization (`elevatedAuthHelper.ts`).
4. **Payment Gateways:** Razorpay SDK 2.9.8, Skydo adapter, and a legacy `DummyPaymentProvider`.
5. **Observability & Logging:** Pino 10.3.1, Sentry (`@sentry/nextjs` 10.69.0), Datadog (`@datadog/browser-rum` / `@datadog/browser-logs` 7.7.0).

---

## 3. Workstream B: Customer Experience & Competitor Gaps

Benchmarked against **Tanishq**, **CaratLane**, **BlueStone**, and **Amazon/Flipkart**:

| Customer Journey Stage | Current Implementation in Codebase | Competitor Benchmark (Tanishq/CaratLane) | Critical Gap / Action Required |
| :--- | :--- | :--- | :--- |
| **1. Discovery & Search** | Keyword search on `Product.title` and category filtering. | Faceted filtering by Karat (14K/18K/22K), Gross Weight, Diamond Clarity (VVS/VS), Occasion, Price Sliders. | Missing structured faceted filter query builder in `/api/products`. |
| **2. Product Details (PDP)** | `ProductGallery`, dynamic fields, variant selector. | Breakdown of Gold Value + Diamond Value + Making Charges + 3% GST, BIS Hallmark certification badges. | Pricing breakdown modal is missing; price is stored as flat Int rather than itemized components. |
| **3. Cart & Stock Locking** | `Cart`, `CartItem`, atomic stock check in `checkout.service.ts`. | 10-minute temporary inventory reservation with countdown timer during payment flow. | `InventoryEvent` has `RESERVATION` type, but cart checkout doesn't hold reservations before gateway redirect. |
| **4. Checkout & GST** | `/api/checkout` with `checkoutService.processCheckout`, GST calculation in `gst.service.ts`. | Address autocomplete, state-based IGST vs CGST/SGST splitting, PIN code serviceability check. | PIN code logistics serviceability check is not linked to checkout address submission. |
| **5. Payments** | Razorpay checkout initiation with idempotency key. | Instant retry on bank failure, Skydo for international USD cards, EMI calculator. | Need seamless fallback if Razorpay order fails; ensure webhook handles asynchronous success. |
| **6. Post-Purchase Tracking** | `OrderShipment` tracking with BlueDart, DHL, FedEx, Shiprocket. | Live step-by-step parcel map, armored courier signature confirmation notice, SMS/WhatsApp alerts. | SMS/WhatsApp dispatch via Twilio is documented in `docs/future_implementations/twilio_setup.md` but not activated. |
| **7. Returns & Refunds** | `OrderReturn` model and `/api/admin/returns` endpoint. | Self-service RMA initiation from customer profile with insured reverse-pickup scheduling. | Storefront customer return request UI is missing; currently only controllable from admin. |

---

## 4. Workstream C: Single-Operator Admin Assessment

Can **one person** operate Vamika Jewels completely without direct database intervention?

### Current vs. Expected Admin Navigation Gap

```
EXISTING ADMIN SIDEBAR (11 Routes)          TARGET CTO STRUCTURE (14 Functional Domains)
├── Overview                                ├── Overview (KPIs, Action Required, Critical Alerts)
│   ├── Dashboard (Stats & KPIs)   ───────► ├── Catalog (Products, Variants, Categories, Media, SEO)
│   └── Analytics (Charts)                  ├── Inventory (SKUs, Movements, Low Stock, Restock POs)
├── Sales & Fulfillment                     ├── Orders (Lifecycle, Verification, Packing Slips)
│   ├── Orders (Fulfillment & AWB) ───────► ├── Shipping & Returns (Labels, Live Tracking, RMA)
│   └── Returns & RMA                       ├── Payments & Finance (Transactions, Refunds, Invoices) [GAP: No dedicated UI]
├── Catalog                                 ├── Customers (Profiles, Purchase History, Notes)
│   ├── Products (Verification)             ├── Marketing (Coupons, Abandoned Carts)
│   ├── Categories (Taxonomy)               ├── Content & SEO (CMS Pages, Redirects, Sitemaps) [GAP: Missing]
│   ├── Reviews (Moderation)                ├── Analytics (Sales Funnel, Conversion, Backlog)
│   └── Bulk Import (Excel/CSV)             ├── Automation (Cron status, Scheduled Jobs) [GAP: Missing]
├── Operations & Stock                      ├── Observability & System Health [CRITICAL GAP: Missing]
│   ├── Inventory (Stock adjustments)       ├── Security & Audit (Privileged Actions, Admin Access)
│   ├── Customers (Profiles)                └── Settings & Integrations (Gateway, Logistics, Email/SMS)
│   └── Discounts & Promos
└── System & Governance
    ├── Database Governance (Dual-tier)
    ├── Audit Trail (Compliance)
    └── Store Settings (Profile/Logistics)
```

### Operational Bottlenecks for a Single Operator

1. **Payments & Reconciliation Gaps:**
   - The operator cannot inspect incoming webhook payloads, investigate payment gateway discrepancy logs, or initiate a gateway refund from a unified "Payments & Finance" view.
   - Refunds require manually setting statuses rather than issuing automated API calls to Razorpay.
2. **Missing Observability Tab:**
   - When background crons (`/api/cron/process-outbox`, `/api/cron/reconcile-payments`) fail, there is no UI indicator. The operator must inspect Docker or Vercel server logs.
3. **No Customer Return Initiation Interface:**
   - Because customer self-service returns are not implemented on the storefront, every return requires manual phone/email support and manual entry.

---

## 5. Workstream D: Security & Financial Integrity Findings

### Ranked Security Findings (Severity Order)

| Severity | ID | Vulnerability / Issue | Location | Evidence / Impact |
| :---: | :---: | :--- | :--- | :--- |
| **CRITICAL (P0)** | **SEC-01** | **Unauthenticated Public Orders API Exposing Customer PII** | [app/api/orders/route.ts](file:///Users/yavnesh/Workplace/jewellery/app/api/orders/route.ts#L4-L44) | Route executes `prisma.customer_order.findMany()` with zero authentication, pagination up to 100, returning full names, email addresses, phone numbers, home addresses, and order amounts to any unauthenticated caller. |
| **CRITICAL (P0)** | **SEC-02** | **Unprotected Background Cron Endpoints** | [app/api/cron/reconcile-payments/route.ts](file:///Users/yavnesh/Workplace/jewellery/app/api/cron/reconcile-payments/route.ts#L6-L65) | Cron endpoints (`reconcile-payments`, `process-outbox`, `release-reservations`) have no `Authorization: Bearer <CRON_SECRET>` or API key validation. Anyone can trigger or flood reconciliation jobs. |
| **HIGH (P1)** | **SEC-03** | **Dual Webhook Handlers with Dummy Provider in Production Route** | [app/api/webhooks/payment/route.ts](file:///Users/yavnesh/Workplace/jewellery/app/api/webhooks/payment/route.ts#L2-L10) | `/api/webhooks/payment` instantiates `new DummyPaymentProvider()` rather than verifying real cryptographic signatures, while `/api/webhooks/razorpay` uses the proper adapter. |
| **HIGH (P1)** | **SEC-04** | **Unrestricted Database Seed Endpoint in Production Build** | [app/api/admin/seed/route.ts](file:///Users/yavnesh/Workplace/jewellery/app/api/admin/seed/route.ts#L1-L10) | While protected by `verifyAdminAuth()`, the seed route remains compiled and accessible in production, allowing any admin to overwrite store categories and create mock products. |
| **MEDIUM (P2)**| **SEC-05** | **Sensitive Root Scripts Left in Production Directory** | Root directory (`check_payment.ts`, `check_stock.ts`, `reset_stock.ts`, `replace_tanishq.js`) | Direct database manipulation scripts containing test queries reside in the root application workspace. |

---

## 6. Workstream E: Observability & Reliability Review

### Existing Observability Infrastructure
- **Health Probes:** `/api/health/ready` validates database connectivity via `SELECT 1`.
- **Error Tracking:** `@sentry/nextjs` is configured in `sentry.client.config.ts` and `sentry.server.config.ts`.
- **RUM & Telemetry:** Datadog browser SDK initialized in `components/DatadogInit.tsx`.

### Required Observability Matrix (Gaps Identified)

| Monitoring Domain | Current Visibility | Production Requirement | Alert Rule to Implement |
| :--- | :--- | :--- | :--- |
| **Application Health** | `/api/health/ready` returns 200/503 | p95 latency, 5xx error tracking, memory footprint | Alert if HTTP 5xx rate > 1% over 5m |
| **Order & Checkout Funnel** | No funnel telemetry | Abandoned checkout sessions, payment init vs completion | Alert if checkout failures > 5 in 15m |
| **Payment Webhooks** | Logs written to `IncomingWebhookEvent` | Dashboard showing webhook queue depth & failed events | Alert on webhook signature validation failure |
| **Outbox & Notification Queue** | Outbox rows processed via `/api/cron/process-outbox` | Failure counter and dead-letter queue monitoring | Alert if `OutboxEvent` attempts $\ge$ 5 |
| **Database Pool** | Direct query via Prisma | MySQL connection pool saturation, slow queries (>500ms) | Alert if Prisma connection pool > 80% |

---

## 7. Workstream F: Code Duplication & Consolidation Register

In accordance with Section 5 of the CTO framework, competing implementations must be cataloged before any file deletion or refactoring is authorized:

| Duplicate Candidates | Usage Evidence | Behavioral Differences | Canonical Selection | Consolidation Plan |
| :--- | :--- | :--- | :--- | :--- |
| **1. Admin Orders Table**<br>`components/AdminOrders.tsx` vs<br>`app/[locale]/(dashboard)/admin/orders/page.tsx` | `AdminOrders.tsx` calls legacy `/api/orders` (unauthenticated). `admin/orders/page.tsx` calls `/api/admin/orders` with bulk actions, filters, and shipping status. | `AdminOrders.tsx` lacks shipping telemetry, pagination controls, carrier tracking, and RBAC security. | **Canonical:** `app/[locale]/(dashboard)/admin/orders/page.tsx` | Deprecate and remove `components/AdminOrders.tsx`; verify no remaining imports in storefront dashboard. |
| **2. Payment Webhook Endpoints**<br>`app/api/webhooks/razorpay/route.ts` vs<br>`app/api/webhooks/payment/route.ts` | External payment gateways post to webhook URLs. `webhooks/payment` uses `DummyPaymentProvider`, while `webhooks/razorpay` uses `paymentProviderRegistry`. | `webhooks/payment` is a mock test scaffold. `webhooks/razorpay` properly verifies signatures and routes events through domain processors. | **Canonical:** `app/api/webhooks/razorpay/route.ts` | Consolidate multi-gateway handling into `/api/webhooks/[provider]/route.ts` using the registry pattern; retire mock route. |
| **3. Outbox Processing Crons**<br>`app/api/cron/outbox/route.ts` vs<br>`app/api/cron/process-outbox/route.ts` | Scheduled cron invocation. | `process-outbox` includes error retry increments and failure limits. | **Canonical:** `app/api/cron/process-outbox/route.ts` | Merge all outbox cron logic into a unified, authenticated `/api/cron/workers/outbox` route. |

---

## 8. Workstream G: Prioritized Delivery Roadmaps

```
┌────────────────────────────────────────────────────────────────────────┐
│                        48-Hour Remediation (P0)                        │
│  • SEC-01: Protect or retire unauthenticated /api/orders route         │
│  • SEC-02: Enforce CRON_SECRET authorization on all /api/cron/* routes │
│  • SEC-03: Remove DummyPaymentProvider from production webhook route   │
│  • Clean root scratch scripts (check_payment.ts, etc.)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        7-Day Stabilization (P1)                        │
│  • Consolidate AdminOrders.tsx into admin/orders page                  │
│  • Implement Observability Tab in Admin with system health telemetry  │
│  • Implement 10-minute cart inventory reservation mechanism            │
│  • Wire Twilio SMS / WhatsApp shipping notification triggers          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        30-Day Core Maturity (P2)                       │
│  • Customer self-service RMA and return request portal                 │
│  • Automated GST tax invoice PDF generation & customer download        │
│  • Advanced faceted jewellery search (Karat, Clarity, Weight filters)  │
│  • Automated payment gateway reconciliation daemon                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                       90-Day Scalability Phase (P3)                    │
│  • Skydo multi-currency international checkout rollout                 │
│  • Read-replica database pooling with Prisma Accelerate                │
│  • Automated carrier pickup dispatch via Shiprocket/BlueDart APIs      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Next Steps & Approval Gate

No code changes have been executed in this audit run. To begin remediation:
1. **Approve 48-Hour P0 security hotfixes** (securing `/api/orders` and adding `CRON_SECRET` headers).
2. **Review the Admin Observability Dashboard specification** to begin single-operator monitoring implementation.
