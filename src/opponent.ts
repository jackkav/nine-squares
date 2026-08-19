import { centerIndex, cornerIndices, countThreatsAfter, emptyIndices, wouldWin, type Mark } from './board';
import { pick, type Rng } from './prng';

// Weight per competitionLevel toward preferring a center/corner square over
// a uniformly random one, once win/block/fork checks are exhausted. Tuned
// (see scratch derivation notes) so difficulty rises meaningfully without
// walling a maxed-out Claude to a 0% win rate — a deterministic "always
// grab the center" opponent turns out to draw a fork-seeking attacker to a
// dead 100% every time, since both solvers race for the same squares and
// the opponent moves second-but-early enough to always win that race. That
// would make competition wins unreachable through automation, defeating
// the point.
const POSITIONAL_PREFERENCE_CHANCE = 0.2;

/**
 * Win > block > random at competitionLevel 0 (the default, and the only
 * level that existed before competitions) — deliberately blind to forks,
 * which keeps the opponent beatable while still requiring the player to
 * think. Raising competitionLevel adds capability on top: level 1 adds a
 * chance of preferring a center/corner square over tier-3 randomness;
 * level 2 also seeks its own forks. See src/opponent.test.ts for the
 * win-rate proof against each of Claude's own automation levels.
 *
 * Level 0's code path is untouched by the levels above it, so every seed
 * derived against the original opponent (tests predating competitions)
 * keeps producing the exact same move sequence.
 */
export function computeOpponentMove(cells: Mark[], size: number, rng: Rng, competitionLevel = 0): number {
  const empty = emptyIndices(cells);

  for (const i of empty) {
    if (wouldWin(cells, i, 'O', size)) return i;
  }
  for (const i of empty) {
    if (wouldWin(cells, i, 'X', size)) return i;
  }

  if (competitionLevel >= 2) {
    for (const i of empty) {
      if (countThreatsAfter(cells, i, 'O', size) >= 2) return i;
    }
  }

  if (competitionLevel >= 1) {
    const special = [centerIndex(size), ...cornerIndices(size)];
    const preferred = empty.filter((i) => special.includes(i));
    if (preferred.length > 0 && rng() < POSITIONAL_PREFERENCE_CHANCE * competitionLevel) {
      return pick(rng, preferred);
    }
  }

  return pick(rng, empty);
}
