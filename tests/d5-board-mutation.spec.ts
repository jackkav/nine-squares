import { test, expect } from '@playwright/test';
import { playMoves } from './helpers';

test('widening the grid produces a 4x4 board', async ({ page }) => {
  await page.goto('/?seed=1&sparks=5');
  await expect(page.getByTestId('cell')).toHaveCount(9);
  await page.getByTestId('prestige-upgrade-widen').click();
  await expect(page.getByTestId('cell')).toHaveCount(16);
  await expect(page.getByTestId('prestige-upgrade-widen')).toHaveAttribute('data-state', 'owned');
});

test('widen is gated on having enough sparks', async ({ page }) => {
  await page.goto('/?seed=1&sparks=1');
  await expect(page.getByTestId('prestige-upgrade-widen')).toBeDisabled(); // costs 3, have 1
});

test('opponent blocks an imminent player line on 4x4', async ({ page }) => {
  // Seed chosen so the opponent's two earlier replies (tier-3, random)
  // don't happen to land on cell 3 by chance — so when cell 3 ends up 'O'
  // after X completes three-in-a-row, it demonstrates the block heuristic
  // firing, not a coincidence.
  await page.goto('/?seed=d5-1&board=4');
  // Player takes 0, 1, 2 on row 0 of a 4-wide board: three in a row, one
  // cell (3) from completing a 4-length line. Placing a 3rd mark is what
  // first makes this an immediate threat on a board this wide, so only
  // now must the opponent block or lose next move.
  await playMoves(page, [0, 1, 2]);
  await expect(page.getByTestId('cell').nth(3)).toHaveAttribute('data-mark', 'O');
});

test('a 4x4 board pays a yield bonus over the base 3x3 rate', async ({ page }) => {
  // Isolates the size-yield-multiplier effect from the prestige purchase
  // flow (?board=4 sets the size directly) and from the separate sparks
  // multiplier (?sparks=0), the same way D7 isolated its own multiplier
  // test from the act of prestiging. Base win pays 3; at 1.5x that rounds
  // to 5 (Math.round(4.5) === 5).
  await page.goto('/?seed=d13-4x4-win-0&board=4&sparks=0');
  await playMoves(page, [0, 1, 4, 15, 7, 3, 11]);
  await expect(page.getByTestId('status')).toContainText('closed the line');
  await expect(page.getByTestId('echo-count')).toHaveText('5');
});

test('widen is meta-scoped: it survives prestige', async ({ page }) => {
  await page.goto('/?seed=1&sparks=5&loop=50');
  await page.getByTestId('prestige-upgrade-widen').click();

  await page.getByTestId('prestige-button').click();
  await page.getByTestId('prestige-confirm').click();

  // The next run also starts at 4x4, not reset to 3x3.
  await expect(page.getByTestId('cell')).toHaveCount(16);
  await expect(page.getByTestId('prestige-upgrade-widen')).toHaveAttribute('data-state', 'owned');
});

test('head start is gated on having enough sparks', async ({ page }) => {
  await page.goto('/?seed=1&sparks=1');
  await expect(page.getByTestId('prestige-upgrade-headstart')).toBeDisabled(); // costs 2, have 1
});

test('head start grants bonus echoes on the next run', async ({ page }) => {
  await page.goto('/?seed=1&sparks=2&loop=50');
  await page.getByTestId('prestige-upgrade-headstart').click();
  await expect(page.getByTestId('prestige-upgrade-headstart')).toHaveAttribute('data-state', 'owned');

  await page.getByTestId('prestige-button').click();
  await page.getByTestId('prestige-confirm').click();
  await expect(page.getByTestId('echo-count')).toHaveText('20');
});
