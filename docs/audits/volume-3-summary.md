# Volume 3: Identity, Security, API & Data Hardening Audit

## What we did?
- **Session Enhancements:** Extended the NextAuth session duration to improve the user experience while maintaining secure HttpOnly cookies.
- **Authorization Hardening:** Implemented centralized route-level and API-level authorization checks.
- **Immutable Order Snapshots:** Updated the order creation logic to store static fields like `priceAtPurchase` in `Customer_order_product` to ensure order history remains unchanged.
- **Data Hardening:** Reviewed input validations across all forms, ensuring Zod schemas strictly parse all incoming user payloads before database mutations occur.

## Why we did that?
- APIs lacked strict ownership validation, meaning users could potentially view other users' data if they guessed the ID.
- Historical orders were pointing dynamically to the product catalog prices. If a product's price was updated in the admin dashboard, past orders showed the new price instead of the historical price paid.
- Loose input validation exposed the database to injection or malformed data attacks.

## What improved after the changes?
- **API Security:** All sensitive endpoints now strictly verify the authenticated user ID against the requested resource.
- **Data Integrity:** Order histories act as immutable receipts, correctly reflecting historical financial data.
- **Stability:** Zod parsing guarantees that the database layer only ever receives perfectly shaped data, eliminating runtime TypeErrors during data insertion.
