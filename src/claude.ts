// Priced in cash rather than echoes: exactly what 2 wins at competition
// level 1 pays out (2 * 5), so "win two competition games" is what it
// actually takes to afford unlocking Claude, not an arbitrary number.
export const AUTOPLAY_CASH_COST = 10;

export const MAX_CLAUDE_LEVEL = 2;

// Cost in tokens to advance FROM index N TO N+1.
const LEVEL_UP_COSTS = [15, 45];

export function claudeLevelUpCost(currentLevel: number): number | null {
  return LEVEL_UP_COSTS[currentLevel] ?? null;
}

// See src/autoplay.ts for what each level actually does.
export const CLAUDE_LEVEL_LABELS = ['Claude', 'Claude I — Reflexive', 'Claude II — Predictive'];

export const TOKENS_PER_AUTO_RESOLUTION = 1;

// Milliseconds between Claude's moves, indexed by level. Each level makes
// Claude both smarter (see autoplay.ts) and faster — a level-up should
// obviously improve the automation, not just its win rate.
const AUTOPLAY_INTERVAL_MS = [500, 350, 200];

export function autoplayIntervalMs(claudeLevel: number): number {
  return AUTOPLAY_INTERVAL_MS[claudeLevel] ?? AUTOPLAY_INTERVAL_MS[AUTOPLAY_INTERVAL_MS.length - 1];
}
