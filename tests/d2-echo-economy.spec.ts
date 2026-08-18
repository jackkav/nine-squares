import { test, expect } from '@playwright/test';
import { playMoves, playToCompletion } from './helpers';

test('a win yields more echoes than a draw or a loss', async ({ page }) => {
  await page.goto('/?seed=win-in-three');
  await playMoves(page, [0, 2, 6, 4]);
  await expect(page.getByTestId('status')).toContainText('closed the line');
  await expect(page.getByTestId('echo-count')).toHaveText('3');
});

test('a draw yields fewer echoes than a win but more than nothing', async ({ page }) => {
  await page.goto('/?seed=forced-draw-1');
  await playToCompletion(page);
  await expect(page.getByTestId('status')).toContainText('Nothing yields');
  await expect(page.getByTestId('echo-count')).toHaveText('2');
});

test('a loss still yields echoes', async ({ page }) => {
  await page.goto('/?seed=forced-loss-0');
  await playToCompletion(page);
  await expect(page.getByTestId('status')).toContainText('opponent closed the line');
  await expect(page.getByTestId('echo-count')).not.toHaveText('0');
  await expect(page.getByTestId('echo-count')).toHaveText('1');
});
