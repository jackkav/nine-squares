import { test, expect } from '@playwright/test';

test('a higher claude level resolves more matches in the same simulated time', async ({ browser }) => {
  // Two isolated browser contexts rather than two goto()s on one page:
  // once a save exists, a later goto() restores from it instead of
  // applying fresh debug params (see the D8 commit) — these need genuinely
  // separate storage to compare claudeLevel=0 against claudeLevel=2.
  //
  // runFor, not fastForward: fastForward only fires a repeating
  // setInterval once no matter how long the requested duration is — it
  // does not synchronously drain the timer queue the way runFor does.
  // Verified directly against a minimal setInterval + page.clock repro
  // outside React entirely, to rule out any app-specific cause.
  const context0 = await browser.newContext();
  const page0 = await context0.newPage();
  await page0.clock.install();
  await page0.goto('/?seed=1&owned=autoplay&claudeLevel=0');
  await page0.clock.runFor('00:10');
  const loopsAtLevel0 = Number(await page0.getByTestId('loop-count').textContent());
  await context0.close();

  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.clock.install();
  await page2.goto('/?seed=1&owned=autoplay&claudeLevel=2');
  await page2.clock.runFor('00:10');
  const loopsAtLevel2 = Number(await page2.getByTestId('loop-count').textContent());
  await context2.close();

  expect(loopsAtLevel2).toBeGreaterThan(loopsAtLevel0);
});
