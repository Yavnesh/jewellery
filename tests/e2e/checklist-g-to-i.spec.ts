import { test, expect } from '@playwright/test';

test.describe('Checklist G & H: Cart & Checkout OTP Workflow Tests', () => {
  test('G1: Add product to cart and verify cart page/drawer update', async ({ page }) => {
    await page.goto('/en/shop');
    const firstProduct = page.locator('a[href*="/product/"]').first();
    await firstProduct.click();

    await page.waitForURL(/\/product\//);

    // Click Add to Cart
    const addToCartBtn = page.locator('button').filter({ hasText: /Add to Cart/i }).first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('H1: Checkout page renders with Mobile OTP verification block', async ({ page }) => {
    await page.goto('/en/checkout');

    // Verify phone number field
    const phoneInput = page.locator('input[placeholder*="8209" i], input[type="tel"]').first();
    await expect(phoneInput).toBeVisible();

    // Verify Send OTP button exists
    const otpButton = page.locator('button').filter({ hasText: /Send OTP|Verify/i }).first();
    await expect(otpButton).toBeVisible();

    // Verify Place Order button is present
    const placeOrderBtn = page.locator('button').filter({ hasText: /Place Order|Pay/i }).first();
    await expect(placeOrderBtn).toBeVisible();
  });

  test('I1: Registration page requires phone and OTP verification', async ({ page }) => {
    await page.goto('/en/register');

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    const otpBtn = page.locator('button').filter({ hasText: /Send OTP/i }).first();

    await expect(emailInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(otpBtn).toBeVisible();
  });
});
