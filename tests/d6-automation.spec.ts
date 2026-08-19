import { test, expect } from '@playwright/test';

test('automation accrues echoes with no input', async ({ page }) => {
  await page.clock.install();
  await page.goto('/?seed=1&cash=10');
  await page.getByTestId('upgrade-autoplay').click();
  const before = await page.getByTestId('echo-count').textContent();
  // runFor, not fastForward: fastForward only fires a repeating
  // setInterval once, no matter how long the requested duration — it
  // doesn't synchronously drain the timer queue the way runFor does. See
  // the D12 commit for the full story; this test predates that finding
  // and previously only passed because the retrying expect() below
  // happened to let a few more ticks through as a side effect of its own
  // polling, not because fastForward actually worked as intended.
  await page.clock.runFor('00:30');
  await expect(page.getByTestId('echo-count')).not.toHaveText(before!);
});

// addInitScript reruns on every navigation, which would clobber the app's
// own freshly-written "last seen" timestamp right before a reload. Seed
// localStorage via a one-off evaluate() instead, after the app has already
// loaded once, so only the following reload sees the stale timestamp.
async function seedLastSeenOneHourAgo(page: import('@playwright/test').Page) {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    ['nine-squares:lastSeen', String(oneHourAgo)],
  );
}

test('offline progress credits elapsed time once, only when automation is owned', async ({ page }) => {
  await page.goto('/?seed=1&owned=autoplay');
  await seedLastSeenOneHourAgo(page);

  await page.reload();
  await expect(page.getByTestId('offline-summary')).toContainText('while you were away');
  await expect(page.getByTestId('echo-count')).not.toHaveText('0');

  await page.reload();
  await expect(page.getByTestId('offline-summary')).toBeHidden();
});

test('offline progress is not credited without automation owned', async ({ page }) => {
  await page.goto('/?seed=1');
  await seedLastSeenOneHourAgo(page);

  await page.reload();
  await expect(page.getByTestId('offline-summary')).toBeHidden();
});
