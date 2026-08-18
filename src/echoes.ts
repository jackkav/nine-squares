export type Outcome = 'win' | 'draw' | 'loss';

// Win pays the most, but a loss is never worthless — the loop should never
// fully stall progress even when the player is having a bad run.
const ECHO_YIELD: Record<Outcome, number> = {
  win: 3,
  draw: 2,
  loss: 1,
};

export function echoesForOutcome(outcome: Outcome): number {
  return ECHO_YIELD[outcome];
}
