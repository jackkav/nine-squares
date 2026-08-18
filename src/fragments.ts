export interface FragmentDef {
  id: string;
  threshold: number;
  text: string;
}

// Ordered ascending by threshold so unlock order and log order always agree.
export const FRAGMENTS: FragmentDef[] = [
  { id: 'f1', threshold: 1, text: 'The board remembers, even when you do not.' },
  { id: 'f2', threshold: 3, text: 'Nine cells. Always nine. Until they are not.' },
  { id: 'f3', threshold: 7, text: 'The opponent has played this game longer than you have been alive.' },
  { id: 'f4', threshold: 12, text: 'Somewhere, the count of loops is the only thing that is real.' },
];

/**
 * Recomputed fresh from loopCount every time, rather than accumulated
 * incrementally, so "never duplicate" holds by construction instead of by
 * bookkeeping discipline.
 */
export function fragmentsForLoopCount(loopCount: number): string[] {
  return FRAGMENTS.filter((f) => f.threshold <= loopCount).map((f) => f.id);
}

/**
 * Unions already-unlocked fragments with whatever the current loop count
 * newly qualifies for. Unlike fragmentsForLoopCount, this never *removes*
 * anything already unlocked — needed because prestige resets loopCount to
 * 0 while fragments (the story) are meant to survive that reset.
 */
export function mergeFragments(unlocked: string[], loopCount: number): string[] {
  const set = new Set(unlocked);
  for (const id of fragmentsForLoopCount(loopCount)) set.add(id);
  return FRAGMENTS.filter((f) => set.has(f.id)).map((f) => f.id);
}
