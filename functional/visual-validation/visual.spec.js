import { test, expect } from '@playwright/test';
import { percySnapshot } from '@percy/playwright';

test('Visual validation - homepage @smoke', async ({ page }) => {
  await page.goto('https://rahulshettyacademy.com/angularpractice/');

  await expect(page).toHaveTitle(/ProtoCommerce/);

  await percySnapshot(page, 'Angular Practice - Homepage');
});
