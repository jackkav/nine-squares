import { test, expect } from '@playwright/test';

test('autoplay unlock is disabled without enough cash', async ({ page }) => {
  await page.goto('/?seed=1&cash=0');
  await expect(page.getByTestId('upgrade-autoplay')).toBeDisabled();
  await expect(page.getByTestId('upgrade-autoplay')).toHaveAttribute('data-state', 'available');
});

test('purchase deducts cash and cannot repeat', async ({ page }) => {
  await page.goto('/?seed=1&cash=10');
  await page.getByTestId('upgrade-autoplay').click();
  await expect(page.getByTestId('cash-count')).toHaveText('0');
  await expect(page.getByTestId('upgrade-autoplay')).toHaveAttribute('data-state', 'owned');
  await expect(page.getByTestId('upgrade-autoplay')).toBeDisabled();
});
