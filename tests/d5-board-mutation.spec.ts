import { test, expect } from '@playwright/test';
import { playMoves } from './helpers';

test('widening the grid produces a 4x4 board', async ({ page }) => {
  await page.goto('/?seed=1&echoes=50');
  await expect(page.getByTestId('cell')).toHaveCount(9);
  await page.getByTestId('upgrade-fourbyfour').click();
  await expect(page.getByTestId('cell')).toHaveCount(16);
  await expect(page.getByTestId('upgrade-fourbyfour')).toHaveAttribute('data-state', 'owned');
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
