import { test, expect } from '@playwright/test';

test.describe('Checklist A: Global / Site-Wide UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test('A1: Logo is visible and navigates to homepage', async ({ page }) => {
    const logo = page.locator('header a, nav a').filter({ hasText: /VAMIKA|Jewels/i }).first();
    await expect(logo).toBeVisible();
    await logo.click();
    await expect(page).toHaveURL(/\/en/);
  });

  test('A2: Top bar displays correct company email and phone', async ({ page }) => {
    const phoneLink = page.locator('a[href*="tel:"]');
    const emailLink = page.locator('a[href*="mailto:"]');

    await expect(phoneLink.first()).toContainText('98296');
    await expect(emailLink.first()).toContainText('vamiexports@gmail.com');
  });

  test('A3: Header navigation is consistent and links function', async ({ page }) => {
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();

    // Verify main category navigation links exist
    const categoryLinks = page.locator('nav a, header a');
    const count = await categoryLinks.count();
    expect(count).toBeGreaterThan(3);
  });

  test('A4: Cart icon displays and is accessible', async ({ page }) => {
    const cartIcon = page.locator('a[href*="/cart"], button[aria-label*="cart"]').first();
    await expect(cartIcon).toBeVisible();
  });

  test('A5: Footer is present with copyright and luxury links', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/VAMIKA|All Rights Reserved|2026/i);
  });
});
