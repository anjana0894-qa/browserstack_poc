import { test, expect } from '@playwright/test';
import { percyScreenshot } from '@percy/playwright';

test('Visual validation - homepage', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/angularpractice/');

    await expect(page).toHaveTitle(/ProtoCommerce/);

    await percyScreenshot(page, 'Angular Practice - Homepage', {
        fullPage: true
    });
});