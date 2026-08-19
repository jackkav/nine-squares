import { test, expect } from '@playwright/test';

test('exchange is disabled without enough cash', async ({ page }) => {
  await page.goto('/?seed=1&cash=5');
  await expect(page.getByTestId('exchange-cash-for-tokens')).toBeDisabled(); // costs 10, have 5
});

test('exchanging cash deducts cash and grants tokens', async ({ page }) => {
  await page.goto('/?seed=1&cash=10');
  await page.getByTestId('exchange-cash-for-tokens').click();
  await expect(page.getByTestId('cash-count')).toHaveText('0');
  await expect(page.getByTestId('token-count')).toHaveText('5');
});

test('exchange is repeatable, not a one-time purchase', async ({ page }) => {
  await page.goto('/?seed=1&cash=25');
  await page.getByTestId('exchange-cash-for-tokens').click();
  await page.getByTestId('exchange-cash-for-tokens').click();
  await expect(page.getByTestId('cash-count')).toHaveText('5');
  await expect(page.getByTestId('token-count')).toHaveText('10');
  // A third click would need 10 cash but only 5 remain.
  await expect(page.getByTestId('exchange-cash-for-tokens')).toBeDisabled();
});

test('exchanged tokens can fund a claude level-up', async ({ page }) => {
  await page.goto('/?seed=1&owned=autoplay&cash=30');
  await page.getByTestId('exchange-cash-for-tokens').click();
  await page.getByTestId('exchange-cash-for-tokens').click();
  await page.getByTestId('exchange-cash-for-tokens').click();
  await expect(page.getByTestId('token-count')).toHaveText('15');
  await page.getByTestId('claude-level-up').click();
  await expect(page.getByTestId('claude-level')).toHaveText('1');
});
