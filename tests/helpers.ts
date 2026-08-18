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

/**
 * Resolves the effective foreground/background colors for an element, as
 * rendered — not from the stylesheet. Walks up the tree past transparent
 * backgrounds to find the one that would actually paint.
 */
export async function readComputedColors(
  page: Page,
  testId: string,
): Promise<{ fg: string; bg: string }> {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!el) throw new Error(`no element with data-testid="${id}"`);
    const fg = getComputedStyle(el).color;
    let node: Element | null = el;
    let bg = 'rgb(255, 255, 255)';
    while (node) {
      const candidate = getComputedStyle(node).backgroundColor;
      const isTransparent = candidate === 'transparent' || /rgba?\([^)]*,\s*0\s*\)/.test(candidate);
      if (candidate && !isTransparent) {
        bg = candidate;
        break;
      }
      node = node.parentElement;
    }
    return { fg, bg };
  }, testId);
}

function parseColor(color: string): [number, number, number] {
  const match = color.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (!match) throw new Error(`unparseable color: ${color}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const channel = c / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** WCAG relative luminance contrast ratio between two CSS colors. */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(parseColor(fg));
  const l2 = relativeLuminance(parseColor(bg));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
