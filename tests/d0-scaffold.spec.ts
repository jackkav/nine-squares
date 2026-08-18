import { test, expect } from '@playwright/test';

test('app boots and renders an empty board', async ({ page }) => {
  await page.goto('/?seed=1');
  await expect(page.getByTestId('board')).toBeVisible();
  await expect(page.getByTestId('cell').filter({ hasText: /\S/ })).toHaveCount(0);
  await expect(page.getByTestId('loop-count')).toHaveText('0');
});
