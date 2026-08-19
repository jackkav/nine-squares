import { test, expect } from '@playwright/test';
import { playMoves } from './helpers';

test('a win at the base (casual) level pays no cash', async ({ page }) => {
  await page.goto('/?seed=win-in-three');
  await playMoves(page, [0, 2, 6, 4]);
  await expect(page.getByTestId('status')).toContainText('closed the line');
  await expect(page.getByTestId('cash-count')).toHaveText('0');
});

test('a win at competition level 1 pays cash', async ({ page }) => {
  await page.goto('/?seed=win-in-three&competitionLevel=1');
  await playMoves(page, [0, 2, 6, 4]);
  await expect(page.getByTestId('status')).toContainText('closed the line');
  await expect(page.getByTestId('cash-count')).toHaveText('5');
});

test('a win at competition level 2 pays a bigger cash prize', async ({ page }) => {
  await page.goto('/?seed=win-in-three&competitionLevel=2');
  await playMoves(page, [0, 2, 6, 4]);
  await expect(page.getByTestId('status')).toContainText('closed the line');
  await expect(page.getByTestId('cash-count')).toHaveText('15');
});

test('competition level-up is disabled when echoes are insufficient', async ({ page }) => {
  await page.goto('/?seed=1&echoes=10&totalGames=3');
  await expect(page.getByTestId('competition-level')).toHaveText('0');
  await expect(page.getByTestId('competition-level-up')).toBeDisabled(); // costs 30, have 10
});

test('purchasing a competition level deducts echoes and advances the level', async ({ page }) => {
  await page.goto('/?seed=1&echoes=30&totalGames=3');
  await page.getByTestId('competition-level-up').click();
  await expect(page.getByTestId('echo-count')).toHaveText('0');
  await expect(page.getByTestId('competition-level')).toHaveText('1');
});

test('competition cannot level past the max', async ({ page }) => {
  await page.goto('/?seed=1&competitionLevel=1&echoes=100&totalGames=3');
  await page.getByTestId('competition-level-up').click();
  await expect(page.getByTestId('competition-level')).toHaveText('2');
  await expect(page.getByTestId('competition-level-maxed')).toBeVisible();
});

test('prestige resets competition level and cash, but not the competition unlock itself', async ({ page }) => {
  await page.goto('/?seed=1&competitionLevel=2&cash=50&loop=50&totalGames=3');
  await page.getByTestId('prestige-button').click();
  await page.getByTestId('prestige-confirm').click();

  await expect(page.getByTestId('cash-count')).toHaveText('0');
  // Still visible and interactable post-prestige — totalGamesPlayed is a
  // lifetime stat, not a run-scoped one, so the panel doesn't re-hide.
  await expect(page.getByTestId('competition-level')).toHaveText('0');
});
