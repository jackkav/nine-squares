import { test, expect } from '@playwright/test';
import { advanceLoops } from './helpers';

test('fragments unlock at their loop threshold and never duplicate', async ({ page }) => {
  await page.goto('/?seed=1&loop=0');
  await expect(page.getByTestId('fragment')).toHaveCount(0);

  await advanceLoops(page, 3);
  await expect(page.getByTestId('loop-count')).toHaveText('3');
  await expect(page.getByTestId('fragment')).toHaveCount(2); // thresholds 1 and 3

  await advanceLoops(page, 2);
  await expect(page.getByTestId('loop-count')).toHaveText('5');
  await expect(page.getByTestId('fragment')).toHaveCount(2); // no threshold at 4 or 5
});

test('loading directly at a loop count above zero unlocks fragments already passed', async ({ page }) => {
  await page.goto('/?seed=1&loop=3');
  await expect(page.getByTestId('fragment')).toHaveCount(2);
});
