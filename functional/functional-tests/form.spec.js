import { test, expect } from '@playwright/test';

test('Submit Angular Practice form successfully', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/angularpractice/');

    await expect(page).toHaveTitle(/ProtoCommerce/);

    await page.getByLabel('Name').fill('Anjana');

    await page.getByLabel('Email').fill('anjana@example.com');

    await page.getByLabel('Password').fill('Test@123');

    await page.getByLabel('Gender').selectOption('Female');

    await page.getByLabel('Employment Status').selectOption('student');

    await page.getByLabel('Shop').selectOption('option1');

    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(
        page.getByText('Success! The Form has been submitted successfully!')
    ).toBeVisible();
});