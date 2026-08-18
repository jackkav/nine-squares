import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { contrastRatio, readComputedColors } from './helpers';

test('no axe violations', async ({ page }) => {
  await page.goto('/?seed=1&loop=1');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('text meets AA contrast against its actual computed background', async ({ page }) => {
  await page.goto('/?seed=1&loop=1');
  for (const id of ['status', 'echo-count', 'loop-count', 'meta-currency', 'fragment']) {
    const { fg, bg } = await readComputedColors(page, id);
    expect(contrastRatio(fg, bg), `${id}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  }
});

test('the board is playable by keyboard', async ({ page }) => {
  await page.goto('/?seed=1');
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('cell').first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cell').first()).toHaveAttribute('data-mark', 'X');
});

test('cell focus rings are visible', async ({ page }) => {
  await page.goto('/?seed=1');
  await page.getByTestId('cell').first().focus();
  const outline = await page.getByTestId('cell').first().evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
});

test('the reduced-motion preference removes the cell transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?seed=1');
  const transition = await page
    .getByTestId('cell')
    .first()
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(transition).toBe('0s');
});
