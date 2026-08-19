export const MAX_CLAUDE_LEVEL = 2;

// Cost in tokens to advance FROM index N TO N+1.
const LEVEL_UP_COSTS = [15, 45];

export function claudeLevelUpCost(currentLevel: number): number | null {
  return LEVEL_UP_COSTS[currentLevel] ?? null;
}

// See src/autoplay.ts for what each level actually does.
export const CLAUDE_LEVEL_LABELS = ['Claude', 'Claude I — Reflexive', 'Claude II — Predictive'];

export const TOKENS_PER_AUTO_RESOLUTION = 1;
