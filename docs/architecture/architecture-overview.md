# Architecture Overview

## What we did?
- **Server-Authoritative Paradigm:** Transitioned the application from trusting client-side browser state to strict server-side validation. Carts, pricing, and orders are computed exclusively in `Next.js Server Actions` and `Route Handlers`.
- **Modular Monolith Design:** Organized the `/src/modules/` directory into domains (e.g., `checkout`, `payments`, `notifications`) rather than spreading logic arbitrarily across the UI tree.
- **Idempotency Layer:** Introduced the `PaymentEvent` model to strictly record and deduplicate incoming asynchronous webhooks.

## Why we did that?
- The previous prototype allowed the client browser to dictate prices, which is a critical security vulnerability for e-commerce.
- The codebase was tightly coupled to UI components, making it difficult to write backend tests or swap out third-party integrations (like payment gateways).
- Webhooks from external providers (like Stripe) can be delivered multiple times. Without idempotency, a single user could be charged twice, or an order could be fulfilled twice.

## What improved after the changes?
- **Security & Trust:** The platform is mathematically immune to client-side cart manipulation.
- **Maintainability:** Engineers can update the `checkout` module independently without risking side effects in the `catalog` module.
- **Scalability:** The architecture now cleanly supports adding new payment providers or Notification channels (like SMS) by simply implementing a new class against the existing interfaces.
