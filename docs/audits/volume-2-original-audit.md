# Volume 2: Core E-Commerce Flows
*Comprehensive E-Commerce Audit*

## 4. Product Catalog

### Executive Summary
The product catalog relies on a standard relational database structure via Prisma. It correctly separates products from their relational data like categories and images, but lacks advanced merchandising capabilities.

### Current State
- **Attributes:** Handled via flat columns on the `Product` model (`metalType`, `purity`, `gender`, `occasion`).
- **Inventory:** Basic integer `inStock` column. 

### Weaknesses & Missing Features
- **Variants:** No concept of "Product Variants" (e.g., a ring in size 5, 6, 7). Each size would have to be a unique product, which is unacceptable for jewelry.
- **Pricing:** No discounting engine or active sales price modeling (only `price` and `originalPrice`).
- **Product Relationships:** "Styling Available" and "Customers Also Viewed" are currently completely hardcoded in the frontend.

### Recommendations
- Re-architect the `Product` schema to include a `ProductVariant` model to support ring sizes and chain lengths.
- Implement an algorithmic recommendation engine or simple relational tables for cross-selling.

---

## 5. Search

### Executive Summary
Search discoverability is virtually non-existent beyond direct category filtering.

### Current State
- The shop page filters via Prisma query parameters.
- There is no global text search implementation.

### Severe Production Issues
- In luxury e-commerce, up to 40% of revenue comes from users who use the search bar. Missing search completely cripples conversion.

### Recommendations
- Integrate an enterprise search provider (Algolia, Meilisearch, or ElasticSearch) to handle typo-tolerance, synonyms (e.g., "bangle" = "bracelet"), and instant autocomplete.
- **Business Impact:** Critical | **Effort:** L
- **UX Score:** 1/10

---

## 7. Shopping Cart

### Executive Summary
The Shopping Cart implementation represents one of the highest security and UX risks on the entire platform.

### Current State
- **State Management:** Handled entirely client-side using Zustand and `sessionStorage`.

### Severe Production Issues
- **No Persistence:** If a user closes their tab, the cart is deleted.
- **No Device Sync:** A user logged in on mobile will not see their cart on desktop.
- **Security Flaw:** Because cart totals are calculated client-side in `sessionStorage`, an attacker can easily manipulate local variables.

### Recommendations
- Immediately migrate the cart to the backend database (`Cart` and `CartItem` models).
- Associate carts with user sessions to allow cross-device shopping.
- **Risk Level:** CRITICAL
- **Production Readiness Score:** 1/10

---

## 8. Checkout & 9. Payments

### Executive Summary
The checkout flow is extremely rudimentary and completely lacks secure, automated payment processing.

### Current State
- **Checkout Form:** A standard React form capturing shipping and billing data.
- **Payments:** Non-existent. The UI states: "You will be contacted for payment details."

### Severe Production Issues (Security & Fraud)
1. **Price Manipulation (BOLA):** The checkout form submits the `total` price directly from the client's `sessionStorage` to the `/api/orders` endpoint. A malicious user can alter their `sessionStorage` to make the order total `$0.01` and the server will accept it.
2. **Manual Processing:** Manually contacting users for payment is not scalable and destroys the impulse-buying nature of e-commerce.

### Recommendations
- **Backend Price Validation:** The `/api/orders` endpoint MUST recalculate the total price by looking up the product IDs in the database. Never trust the client's `total`.
- **Payment Gateway:** Integrate Stripe Elements or PayPal Checkout for secure, immediate capture of funds.
- **Risk Level:** CRITICAL
- **Security Score:** 0/10

---

## 10. Orders

### Executive Summary
Order management is functional but lacks customer empowerment features.

### Current State
- Orders are written to the `Customer_order` table in Prisma.
- Statuses are basic strings ("pending").

### Weaknesses
- No automated tracking, automated invoicing, or user-driven cancellation flows.
- Returns and replacements must be handled offline.

### Recommendations
- Implement a robust Order Status state machine (Pending -> Paid -> Shipped -> Delivered -> Returned).
- Integrate an email provider (SendGrid, Postmark) to trigger transactional order confirmation emails.
