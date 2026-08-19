import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // The statistical win-rate proofs (autoplay.test.ts, opponent.test.ts)
    // simulate thousands of full matches per assertion. That comfortably
    // beats the 5000ms default on a fast machine but not on GitHub's
    // shared CI runners — one such test timed out there while passing
    // locally every time.
    testTimeout: 20_000,
  },
});
