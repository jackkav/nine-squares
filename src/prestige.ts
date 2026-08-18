/** Meta-currency ("sparks") earned per prestige, scaled by how far the run got. */
export function sparksForPrestige(loopCount: number): number {
  return Math.floor(loopCount / 10);
}

/** Permanent echo yield multiplier from accumulated sparks. */
export function multiplierForSparks(sparks: number): number {
  return 1 + sparks * 0.2;
}
