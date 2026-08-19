import { test, expect } from '@playwright/test';
import { playToCompletion } from './helpers';

test('manual play does not earn tokens', async ({ page }) => {
  await page.goto('/?seed=1');
  await playToCompletion(page);
  await expect(page.getByTestId('token-count')).toHaveText('0');
});

test('automated play earns tokens', async ({ page }) => {
  await page.clock.install();
  await page.goto('/?seed=1&owned=autoplay');
  await page.clock.fastForward('00:30');
  await expect(page.getByTestId('token-count')).not.toHaveText('0');
});

// Each scenario below needs its own fresh browser context (rather than
// several page.goto() calls in one test): once the first load writes a
// save, later goto()s in the same context restore from it instead of
// applying new debug params — see the D8 commit for why.

test('claude level-up is disabled when tokens are insufficient', async ({ page }) => {
  await page.goto('/?seed=1&owned=autoplay&tokens=10');
  await expect(page.getByTestId('claude-level')).toHaveText('0');
  await expect(page.getByTestId('claude-level-up')).toBeDisabled(); // costs 15, have 10
});

test('purchasing a claude level deducts tokens and advances the level', async ({ page }) => {
  await page.goto('/?seed=1&owned=autoplay&tokens=15');
  await page.getByTestId('claude-level-up').click();
  await expect(page.getByTestId('token-count')).toHaveText('0');
  await expect(page.getByTestId('claude-level')).toHaveText('1');
});

test('claude cannot level past the max', async ({ page }) => {
  await page.goto('/?seed=1&owned=autoplay&claudeLevel=1&tokens=45');
  await page.getByTestId('claude-level-up').click();
  await expect(page.getByTestId('claude-level')).toHaveText('2');
  await expect(page.getByTestId('claude-level-maxed')).toBeVisible();
});

// Seed found by simulation (see scratch derivation notes) where level 0's
// lowest-empty-index play loses, but level 2's fork-seeking play wins on
// the exact same seed — proves the level actually changes automated play,
// not just its cost. Split across two tests (see the note above) since
// each needs its own fresh save state.

test('claude level 0 loses this seed', async ({ page }) => {
  await page.clock.install();
  await page.goto('/?seed=claude-demo-2&owned=autoplay&claudeLevel=0');
  await page.clock.fastForward('00:10');
  await expect(page.getByTestId('status')).toContainText('opponent closed the line');
});

test('claude level 2 wins the same seed', async ({ page }) => {
  await page.clock.install();
  await page.goto('/?seed=claude-demo-2&owned=autoplay&claudeLevel=2');
  await page.clock.fastForward('00:10');
  await expect(page.getByTestId('status')).toContainText('You closed the line');
});

test('prestige resets tokens and claude level along with echoes and upgrades', async ({ page }) => {
  await page.goto('/?seed=1&owned=autoplay&claudeLevel=2&tokens=30&loop=50');
  await page.getByTestId('prestige-button').click();
  await page.getByTestId('prestige-confirm').click();

  await expect(page.getByTestId('token-count')).toHaveText('0');
  await expect(page.getByTestId('upgrade-autoplay')).toHaveAttribute('data-state', 'available');
  await expect(page.getByTestId('claude-panel')).toBeHidden();
});

test('tokens and claude level survive a reload', async ({ page }) => {
  await page.goto('/?seed=1&owned=autoplay&tokens=15');
  await page.getByTestId('claude-level-up').click();
  await expect(page.getByTestId('claude-level')).toHaveText('1');

  await page.reload();
  await expect(page.getByTestId('claude-level')).toHaveText('1');
  await expect(page.getByTestId('token-count')).toHaveText('0');
});
