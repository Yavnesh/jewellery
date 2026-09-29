# 💎 Vamika Jewels — Luxury Fine Jewellery E-Commerce Platform

> **Vamika Jewels** is a production-ready, full-stack luxury fine jewelry e-commerce platform built on **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **MySQL**, designed for bespoke fine jewelry retail and international trade.

---

## ✨ Key Highlights & Features

### 🛍️ Luxury Storefront Experience
- **Dynamic Fine Jewelry Catalog**: Comprehensive catalog spanning rings, loose diamonds, salt & pepper diamonds, necklaces, earrings, bracelets, brooches, charms, and bridal collections.
- **Precision Dual-Dropdown Ring Size Selector**: Seamless selection between whole sizes (`5` to `16`) and fractional variations (`.00`, `.25`, `.50`, `.75`) mapped directly to backend variant inventory.
- **Internationalization (i18n)**: Multi-locale support (`en`, `hi`, `fr`, etc.) with `next-intl` and dynamic currency conversion.
- **High-Performance Image Gallery & Media**: Zoomable high-resolution imagery, thumbnails carousel, and responsive media handling.
- **Wishlist & Persistent Shopping Cart**: Guest and authenticated persistent shopping carts with server-side validation and optimistic UI updates.

### 🔐 Authentication & Phone OTP Verification
- **Dual Verification Channels**:
  - **User Registration (`/register`)**: Mandatory phone number verification via 6-digit OTP alongside secure email/password credential signup.
  - **Guest & Authenticated Checkout (`/checkout`)**: Live phone number OTP verification to eliminate invalid orders and ensure delivery security.
- **Robust Multi-Gateway SMS Architecture**:
  - Built-in multi-adapter SMS notification engine supporting **Plivo**, **MSG91**, **Twilio**, **Gupshup**, and local development **Mock SMS**.
  - Rate limiting (max 3 requests / 5 mins), HMAC SHA-256 secure hash matching, and brute-force attempt protection.

### 💳 Checkout & Multi-Gateway Payments
- **Smart Payment Routing Policy**:
  - **Razorpay**: Domestic & international credit/debit cards, UPI, Netbanking.
  - **Skydo / Stripe**: Global cross-border multi-currency payment processing.
  - **Cash on Delivery (COD)**: Optional post-verification payment flow.
- **Address & Tax Calculation Snapshot**: Immutable order snapshotting preserving exact product prices and tax breakdowns at purchase time.

### 👑 Comprehensive Admin & Inventory Management
- **Dashboard & Analytics**: Real-time sales statistics, revenue tracking, recent orders, customer metrics, and low-stock alerts.
- **Advanced Product & Variant Management**: Full CRUD for products, hierarchical categories, variants (SKU, metal purity, weight, diamond clarities), and merchandising flags (*Featured, New Arrival, Bestseller*).
- **Bulk Catalog Operations**:
  - **CSV / Excel Bulk Import**: Upload hundreds to thousands of items simultaneously with transactional error rollbacks.
  - **Full Catalog Excel Export**: One-click download of all 3,800+ catalog products with all 27 required specification columns into `.xlsx` (`/api/admin/products/export`).
- **Order Lifecycle Fulfillment**: Manage order statuses (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`), generate tracking numbers, and process refunds/returns.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router), React 18 / 19, TypeScript |
| **Styling & UI** | Tailwind CSS, Flowbite React, Framer Motion, React Icons, Lucide |
| **Database & ORM** | MySQL 8.0, Prisma ORM (`@prisma/client`) |
| **Authentication** | NextAuth.js (JWT Sessions, Credentials Provider) + Custom Phone OTP Engine |
| **State Management** | Zustand (Persistent Cart, Wishlist, Filter States) |
| **Payments** | Razorpay, Skydo, Stripe |
| **SMS Gateways** | Plivo, MSG91, Twilio, Gupshup, Mock SMS Adapter |
| **Emails** | Resend API, React Email templates |
| **Production Deployment** | Docker (Standalone Multi-stage Container), Caddy 2 (Reverse Proxy & Auto-SSL), Redis 7 |

---

## 📁 Repository Structure

```
jewellery/
├── app/                              # Next.js App Router
│   ├── [locale]/                     # Internationalized Storefront & Admin pages
│   │   ├── (dashboard)/admin/        # Admin portal (products, orders, categories, bulk upload)
│   │   ├── (storefront)/             # Public catalog, PDP, collections, cart
│   │   ├── checkout/                 # Secure multi-step checkout with OTP verification
│   │   ├── login/ & register/        # Authentication pages
│   ├── actions/                      # Server Actions (OTP engine, checkout, cart operations)
│   ├── api/                          # REST endpoints (auth, search, bulk-upload, export, webhooks)
├── components/                       # Reusable React components & luxury UI design system
├── lib/                              # Core domain services (Cart, Orders, Catalog, Currency)
├── prisma/
│   ├── schema.prisma                 # Master relational database schema
├── public/                           # Static assets, luxury imagery, and catalog exports
├── scripts/                          # DB seeders, bulk export utilities, maintenance scripts
├── src/modules/                      # Modular enterprise services
│   ├── notifications/                # Multi-provider SMS/WhatsApp adapters & engines
│   └── payments/                     # Payment gateways & routing policies
├── docker-compose.yml                # Production orchestration
└── Dockerfile                        # Multi-stage standalone Next.js build
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **pnpm**
- **MySQL Server**: `8.0` or higher (or via Docker)

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/your-org/jewellery.git
cd jewellery
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Server & App Environment
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database Connection (Prisma)
DATABASE_URL="mysql://root:password@localhost:3306/jewellery_db"

# NextAuth Authentication
NEXTAUTH_SECRET=your_super_secret_generated_key_here
NEXTAUTH_URL=http://localhost:3000

# SMS & OTP Provider (MOCK | PLIVO | MSG91 | TWILIO | GUPSHUP)
SMS_PROVIDER=MOCK

# (Optional) Live SMS Provider Keys:
# PLIVO_AUTH_ID=your_plivo_auth_id
# PLIVO_AUTH_TOKEN=your_plivo_auth_token
# PLIVO_FROM_NUMBER=+1234567890
# MSG91_AUTH_KEY=your_msg91_auth_key
# MSG91_FLOW_ID=your_msg91_template_flow_id
# TWILIO_ACCOUNT_SID=your_twilio_sid
# TWILIO_AUTH_TOKEN=your_twilio_token
# TWILIO_FROM_NUMBER=your_twilio_number

# Payment Gateways (Optional for local testing)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 4. Database Setup & Migrations
```bash
# Push schema to MySQL database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# (Optional) Seed demo products and taxonomy
npm run db:seed
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Key CLI & Management Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts local Next.js development server on port 3000 |
| `npm run build` | Builds optimized standalone production bundle |
| `npm run start` | Starts Next.js production server |
| `npx prisma db push` | Syncs schema changes directly with MySQL |
| `npx prisma studio` | Opens interactive visual database browser |
| `npx tsx scripts/export-products-excel.ts` | Exports all database products to `Vamika_Jewels_Products_Database.xlsx` |

---

## 🚢 Production Deployment (Docker & Caddy)

The application includes production-ready container configurations:

```bash
# Build and start services in detached mode
docker compose up -d --build

# View real-time application logs
docker compose logs -f app

# Run database migrations in container
docker compose exec app npx prisma db push --accept-data-loss
```

---

## 📄 License
This project is proprietary and maintained for **Vamika Jewels**. All rights reserved.
