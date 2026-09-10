# Pending Production Tasks & Incomplete Features

This document tracks items that were scoped during the initial audit/playbooks but are not yet finalized or require real production keys to become fully functional.

## 1. Payments Integration
- **Current State:** Using a `DummyPaymentProvider` which simulates API latency and mock keys.
- **Pending Task:** The exact provider (Stripe, Razorpay, PayPal, etc.) needs to be chosen. Once chosen, a specific provider class (e.g., `StripePaymentProvider`) must be implemented, and the API keys added to Vercel.

## 2. Global Search
- **Current State:** Basic database search functionality.
- **Pending Task:** Implement a robust typo-tolerant search (like Algolia or Typesense) or refine Prisma Full-Text Search for the product catalog.

## 3. Product Recommendations
- **Current State:** Schema exists for related products and cross-sells.
- **Pending Task:** Build the UI carousel and admin interface to map related products together (or integrate a machine learning recommendation engine).

## 4. Headless CMS Integration
- **Current State:** Static React components for homepage heroes, about pages, and editorial content.
- **Pending Task:** Connect a Headless CMS (like Sanity, Contentful, or Strapi) so non-technical staff can update homepage banners, campaigns, and blogs without a code deployment.

## 5. Social Login (Google / Apple)
- **Current State:** NextAuth is configured for Credentials.
- **Pending Task:** Configure Google and Apple OAuth providers in NextAuth, requiring actual Developer Console App ID configurations.

## 6. Official Legal Content
- **Current State:** Placeholder templates exist for Privacy Policy and Terms of Service.
- **Pending Task:** Legal team must provide official copy for these pages, tailored to the specific jurisdictions of operation.
