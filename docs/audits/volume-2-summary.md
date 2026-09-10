# Volume 2: Product Catalog & Cart Modernization Audit

## What we did?
- **Database Schema Upgrades:** Migrated the Prisma schema to support `ProductVariant` as the core purchasable entity (handling dynamic sizes, metal types, lengths).
- **Persistent Server-Side Carts:** Replaced the local `sessionStorage` cart with a robust MySQL-backed cart system (`Cart` and `CartItem` tables).
- **Guest vs. Authenticated Carts:** Implemented functionality to merge guest carts seamlessly into an authenticated user cart upon login.
- **Server-Authoritative Pricing:** Removed all pricing trust from the client browser. Prices, discounts, shipping, and taxes are strictly calculated on the server using `pricing.service.ts`.
- **Inventory Validation:** Added strict pre-checkout checks to ensure products are active and in stock before allowing a purchase.

## Why we did that?
- The old architecture allowed users to manipulate their cart prices via browser dev-tools (a major security flaw).
- Carts were being lost when users switched devices or cleared cookies because they were only stored in the browser's `sessionStorage`.
- The product catalog couldn't accurately reflect inventory for specific variants (like ring sizes), leading to overselling.

## What improved after the changes?
- **Security:** It is now impossible for malicious users to alter product prices during checkout.
- **User Experience:** Customers can now start shopping on their phone as a guest, log in on their laptop, and their cart will seamlessly carry over and merge.
- **Operations:** Inventory is strictly managed, reducing the risk of selling items that are actually out of stock.
