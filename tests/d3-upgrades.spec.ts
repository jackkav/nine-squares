import { test, expect } from '@playwright/test';

test('upgrades gate on affordability', async ({ page }) => {
  await page.goto('/?seed=1&echoes=0');
  await expect(page.getByTestId('upgrade-autoplay')).toBeDisabled();
  await expect(page.getByTestId('upgrade-autoplay')).toHaveAttribute('data-state', 'available');
});

test('purchase deducts cost and cannot repeat', async ({ page }) => {
  await page.goto('/?seed=1&echoes=10');
  await page.getByTestId('upgrade-autoplay').click();
  await expect(page.getByTestId('echo-count')).toHaveText('2');
  await expect(page.getByTestId('upgrade-autoplay')).toHaveAttribute('data-state', 'owned');
  await expect(page.getByTestId('upgrade-autoplay')).toBeDisabled();
});
