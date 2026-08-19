import { test, expect } from '@playwright/test';
import { playMoves, playToCompletion } from './helpers';

test('wins and losses are tracked, and echoes/sparks stay as a separate track', async ({ page }) => {
  await page.goto('/?seed=win-in-three');
  await expect(page.getByTestId('win-count')).toHaveText('0');
  await expect(page.getByTestId('loss-count')).toHaveText('0');
  await playMoves(page, [0, 2, 6, 4]);
  await expect(page.getByTestId('win-count')).toHaveText('1');
  await expect(page.getByTestId('loss-count')).toHaveText('0');
  // Echoes still accrue independently of the new win/loss stats — this is
  // an additional track, not a replacement (see the design discussion).
  await expect(page.getByTestId('echo-count')).not.toHaveText('0');
});

test('a loss increments the loss counter, not the win counter', async ({ page }) => {
  await page.goto('/?seed=forced-loss-0');
  await playToCompletion(page);
  await expect(page.getByTestId('status')).toContainText('opponent closed the line');
  await expect(page.getByTestId('win-count')).toHaveText('0');
  await expect(page.getByTestId('loss-count')).toHaveText('1');
});

test('competition is locked until 3 games have been played', async ({ page }) => {
  await page.goto('/?seed=1&totalGames=0');
  await expect(page.getByTestId('competition-locked')).toBeVisible();
  await expect(page.getByTestId('competition-panel')).toBeHidden();
});

test('competition unlocks once 3 games have been played', async ({ page }) => {
  await page.goto('/?seed=1&totalGames=2');
  await expect(page.getByTestId('competition-locked')).toContainText('1 more game');
  await playToCompletion(page); // the 3rd game
  await expect(page.getByTestId('competition-locked')).toBeHidden();
  await expect(page.getByTestId('competition-panel')).toBeVisible();
});

test('the competition unlock survives prestige (it is a lifetime stat, not a run stat)', async ({ page }) => {
  await page.goto('/?seed=1&totalGames=3&loop=50');
  await expect(page.getByTestId('competition-panel')).toBeVisible();

  await page.getByTestId('prestige-button').click();
  await page.getByTestId('prestige-confirm').click();

  // loopCount (run-scoped) reset to 0, but the panel must still be visible.
  await expect(page.getByTestId('loop-count')).toHaveText('0');
  await expect(page.getByTestId('competition-panel')).toBeVisible();
});

test('autoplay is unaffordable before competition is even reachable', async ({ page }) => {
  await page.goto('/?seed=1&totalGames=0');
  await expect(page.getByTestId('upgrade-autoplay')).toBeDisabled();
});
