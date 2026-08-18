import { test, expect } from '@playwright/test';
import { playMoves, playToCompletion } from './helpers';

test('player win increments the loop and clears the board', async ({ page }) => {
  await page.goto('/?seed=win-in-three');
  // Forces a fork (X at 0, 2, 6 threatens two lines at once) that this
  // opponent, which only reacts to immediate threats, cannot fully block.
  await playMoves(page, [0, 2, 6, 4]);
  await expect(page.getByTestId('status')).toContainText('closed the line');
  await expect(page.getByTestId('loop-count')).toHaveText('1');
  await expect(page.getByTestId('cell').filter({ hasText: /\S/ })).toHaveCount(0);
});

test('a filled board with no line resolves as a draw', async ({ page }) => {
  await page.goto('/?seed=forced-draw-1');
  await playToCompletion(page);
  await expect(page.getByTestId('status')).toContainText('Nothing yields');
  await expect(page.getByTestId('loop-count')).toHaveText('1');
  await expect(page.getByTestId('cell').filter({ hasText: /\S/ })).toHaveCount(0);
});

test('occupied cells reject further clicks', async ({ page }) => {
  await page.goto('/?seed=1');
  await page.getByTestId('cell').nth(4).click();
  const mark = await page.getByTestId('cell').nth(4).textContent();
  expect(mark).toBe('X');
  await page.getByTestId('cell').nth(4).click({ force: true });
  await expect(page.getByTestId('cell').nth(4)).toHaveText(mark!);
});
