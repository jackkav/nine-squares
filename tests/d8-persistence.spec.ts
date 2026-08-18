import { test, expect } from '@playwright/test';

test('state survives a reload', async ({ page }) => {
  await page.goto('/?seed=1&echoes=42');
  await page.getByTestId('upgrade-autoplay').click();
  await expect(page.getByTestId('echo-count')).toHaveText('34');

  await page.reload();
  await expect(page.getByTestId('echo-count')).toHaveText('34');
  await expect(page.getByTestId('upgrade-autoplay')).toHaveAttribute('data-state', 'owned');
});

test('a v1 save migrates into the current schema', async ({ page }) => {
  const v1Fixture = {
    version: 1,
    cells: Array(9).fill(null),
    size: 3,
    loopCount: 2,
    echoes: 15,
    upgrades: ['autoplay'], // v1 stored owned ids as a plain string array
    fragments: ['f1'],
  };
  await page.addInitScript(
    (fixture) => localStorage.setItem('save', JSON.stringify(fixture)),
    v1Fixture,
  );

  await page.goto('/');
  await expect(page.getByTestId('echo-count')).toHaveText('15');
  await expect(page.getByTestId('loop-count')).toHaveText('2');
  await expect(page.getByTestId('upgrade-autoplay')).toHaveAttribute('data-state', 'owned');
  await expect(page.getByTestId('fragment')).toHaveCount(1);
});
