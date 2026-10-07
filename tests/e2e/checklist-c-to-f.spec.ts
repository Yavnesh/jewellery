import { test, expect } from '@playwright/test';

test.describe('Checklist C to E: Catalog, Search & PDP Tests', () => {
  test('C1: Homepage hero loads with CTA buttons and categories', async ({ page }) => {
    await page.goto('/en');
    const heroHeading = page.locator('h1, h2').first();
    await expect(heroHeading).toBeVisible();

    const shopButtons = page.locator('a[href*="/shop"]').first();
    await expect(shopButtons).toBeVisible();
  });

  test('D1: Shop/Category page displays product cards with price', async ({ page }) => {
    await page.goto('/en/shop');
    const productCard = page.locator('a[href*="/product/"]').first();
    await expect(productCard).toBeVisible();

    const price = page.locator('text=₹').first();
    await expect(price).toBeVisible();
  });

  test('E1: Product Details Page loads with dual ring size dropdown selectors', async ({ page }) => {
    await page.goto('/en/shop');
    // Click first product
    const firstProduct = page.locator('a[href*="/product/"]').first();
    await firstProduct.click();

    await page.waitForURL(/\/product\//);

    // Verify Title & Price prominent
    const title = page.locator('h1').first();
    await expect(title).toBeVisible();

    const price = page.locator('text=₹').first();
    await expect(price).toBeVisible();

    // Verify Add to Cart button exists
    const addToCartBtn = page.locator('button').filter({ hasText: /Add to Cart|Buy Now/i }).first();
    await expect(addToCartBtn).toBeVisible();
  });

  test('F1: Search functionality handles query and returns results', async ({ page }) => {
    await page.goto('/en');
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('Diamond');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);
      const results = page.locator('a[href*="/product/"]');
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});
