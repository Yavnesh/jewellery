# Engineering Standards Overview

## What we did?
- **Automated Testing & CI/CD:** Integrated Vitest (for backend unit tests) and Playwright (for End-to-End browser tests). Created GitHub Actions to automatically run these tests, linting, and type-checking on every pull request.
- **The Outbox Pattern:** Shifted email dispatching from synchronous API calls to an asynchronous background worker using Prisma transactions and an `OutboxEvent` table.
- **Observability:** Replaced standard `console.log` with a structured JSON logger (`pino`) and integrated Sentry for real-time error tracking and performance monitoring.
- **Database Connection Pooling:** Configured Prisma with optimal connection pool settings and integrated query timeouts.

## Why we did that?
- Manual testing was slowing down development, and pushing code without automated checks risked breaking the production checkout flow.
- The 3rd party email API (Resend) could occasionally time out. If an email timed out during a user's checkout, the entire order would fail to save in the database, losing a sale.
- Without structured logs and a service like Sentry, debugging a failed webhook in production meant digging through raw text files with no context.
- Serverless environments (like Vercel) can instantly spawn hundreds of connections to the database, exhausting the MySQL pool and causing the site to crash.

## What improved after the changes?
- **Reliability:** Background jobs (like emails) are guaranteed to process eventually, completely removing 3rd-party API latency from the critical user path.
- **Deployment Confidence:** Developers can now confidently merge code knowing the automated CI/CD pipeline will block the merge if the checkout flow breaks.
- **Visibility:** Operations teams can instantly track the exact line of code that caused a production error, alongside the user's exact payload context, drastically reducing Time-To-Resolution (TTR) for bugs.
