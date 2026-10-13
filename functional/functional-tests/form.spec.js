import { test, expect } from '@playwright/test';

test('Submit Angular Practice form successfully', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/angularpractice/');

    await expect(page).toHaveTitle(/ProtoCommerce/);
});