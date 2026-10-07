import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Desktop Large', width: 1440, height: 900 },
  { name: 'Laptop', width: 1024, height: 768 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile Standard', width: 375, height: 812 },
  { name: 'Small Mobile', width: 320, height: 568 },
];

test.describe('Checklist B: Responsive Viewport Design Tests', () => {
  for (const vp of viewports) {
    test(`B: Responsive test on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/en');

      // 1. Check no horizontal overflow scrolling
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

      // 2. Check main header visibility
      const header = page.locator('header');
      await expect(header).toBeVisible();

      // 3. Ensure primary CTA / Hero content is readable
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    });
  }
});
