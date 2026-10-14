import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Rahul Shetty Angular Practice Visual Tests', () => {
  test('Home page visual check', async ({ page }) => {
    const baseUrl = process.env.BASE_URL || 'https://rahulshettyacademy.com/angularpractice/';
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, 'Angular Practice - Home Page');
  });

  test('Shop page visual check', async ({ page }) => {
    const shopUrl = (process.env.BASE_URL || 'https://rahulshettyacademy.com/angularpractice/') + 'shop';
    await page.goto(shopUrl);
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, 'Angular Practice - Shop Page');
  });
});s