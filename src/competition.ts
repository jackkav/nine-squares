// Games played (any outcome) before the Competition panel reveals itself.
export const COMPETITION_UNLOCK_GAMES = 3;

export const MAX_COMPETITION_LEVEL = 2;

// Cost in echoes to advance FROM index N TO N+1.
const LEVEL_UP_COSTS = [30, 100];

export function competitionLevelUpCost(currentLevel: number): number | null {
  return LEVEL_UP_COSTS[currentLevel] ?? null;
}

export const COMPETITION_LEVEL_LABELS = ['Casual', 'Competition I', 'Competition II'];

// Cash paid for a win AT this competition level. Index 0 unused (level 0
// pays nothing — cash is the reward specifically for entering competition).
const CASH_PRIZES = [0, 5, 15];

export function cashPrizeForLevel(competitionLevel: number): number {
  return CASH_PRIZES[competitionLevel] ?? 0;
}
