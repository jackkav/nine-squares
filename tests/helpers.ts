import type { Page } from '@playwright/test';

/** Clicks a fixed sequence of board cells by index, as the player (X). */
export async function playMoves(page: Page, cellIndices: number[]) {
  for (const i of cellIndices) {
    await page.getByTestId('cell').nth(i).click();
  }
}

/**
 * Plays as the player by always taking the lowest-index empty cell, until
 * the loop count increments (i.e. the match resolves — win, loss, or
 * draw). Paired with a seed found to produce a specific outcome against
 * this exact strategy — see scratch derivation notes in the D1 commit.
 *
 * Resolution is detected via the loop count rather than the status text,
 * because consecutive matches can land on the same outcome (e.g. two
 * draws in a row), which would make a text-equality check miss the
 * second resolution.
 */
export async function playToCompletion(page: Page, maxMoves = 9) {
  const loopCountBefore = await page.getByTestId('loop-count').textContent();
  for (let move = 0; move < maxMoves; move++) {
    const cells = page.getByTestId('cell');
    const count = await cells.count();
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const mark = await cells.nth(i).getAttribute('data-mark');
      if (!mark) {
        await cells.nth(i).click();
        clicked = true;
        break;
      }
    }
    if (!clicked) return;
    const loopCountAfter = await page.getByTestId('loop-count').textContent();
    if (loopCountAfter !== loopCountBefore) return;
  }
}

/** Plays n complete matches in a row, each via playToCompletion. */
export async function advanceLoops(page: Page, n: number) {
  for (let i = 0; i < n; i++) {
    await playToCompletion(page);
  }
}
