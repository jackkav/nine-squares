import type { Page } from '@playwright/test';

/** Clicks a fixed sequence of board cells by index, as the player (X). */
export async function playMoves(page: Page, cellIndices: number[]) {
  for (const i of cellIndices) {
    await page.getByTestId('cell').nth(i).click();
  }
}

/**
 * Plays as the player by always taking the lowest-index empty cell, until
 * the status region announces a resolution (win, loss, or draw). Paired
 * with a seed found to produce a specific outcome against this exact
 * strategy — see scratch derivation notes in the D1 commit.
 */
export async function playToCompletion(page: Page, maxMoves = 9) {
  for (let move = 0; move < maxMoves; move++) {
    const statusBefore = await page.getByTestId('status').textContent();
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
    const statusAfter = await page.getByTestId('status').textContent();
    if (statusAfter && statusAfter !== statusBefore) return;
  }
}
