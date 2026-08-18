import { test, expect } from '@playwright/test';
import { playMoves } from './helpers';

test('prestige resets the run but preserves fragments and meta-currency', async ({ page }) => {
  await page.goto('/?seed=1&echoes=200&loop=50&owned=autoplay');
  const fragmentsBefore = await page.getByTestId('fragment').count();
  expect(fragmentsBefore).toBeGreaterThan(0);

  await page.getByTestId('prestige-button').click();
  await page.getByTestId('prestige-confirm').click();

  await expect(page.getByTestId('echo-count')).toHaveText('0');
  await expect(page.getByTestId('loop-count')).toHaveText('0');
  await expect(page.getByTestId('upgrade-autoplay')).toHaveAttribute('data-state', 'available');
  await expect(page.getByTestId('fragment')).toHaveCount(fragmentsBefore);
  await expect(page.getByTestId('meta-currency')).not.toHaveText('0');
});

test('cancelling the prestige confirmation changes nothing', async ({ page }) => {
  await page.goto('/?seed=1&echoes=200&loop=50');
  await page.getByTestId('prestige-button').click();
  await page.getByTestId('prestige-cancel').click();
  await expect(page.getByTestId('echo-count')).toHaveText('200');
  await expect(page.getByTestId('meta-currency')).toHaveText('0');
});

test('prestiging 50 loops worth of progress grants 5 sparks', async ({ page }) => {
  await page.goto('/?seed=1&loop=50');
  await page.getByTestId('prestige-button').click();
  await page.getByTestId('prestige-confirm').click();
  await expect(page.getByTestId('meta-currency')).toHaveText('5');
});

test('accumulated sparks measurably increase echo yield', async ({ page }) => {
  // Isolates the yield-multiplier effect from the act of prestiging (already
  // covered above) by seeding sparks directly: 5 sparks -> multiplier
  // 1 + 5*0.2 = 2x, so a win pays 6 echoes instead of the base 3.
  await page.goto('/?seed=win-in-three&sparks=5');
  await playMoves(page, [0, 2, 6, 4]);
  await expect(page.getByTestId('status')).toContainText('closed the line');
  await expect(page.getByTestId('echo-count')).toHaveText('6');
});
