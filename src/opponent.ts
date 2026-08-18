import type { Mark } from './board';
import { wouldWin } from './board';
import { pick, type Rng } from './prng';

/**
 * Win > block > random. The opponent never looks further than one move
 * ahead, so it is blind to forks — a deliberate limitation, not a bug: it
 * keeps the opponent beatable while still requiring the player to think.
 */
export function computeOpponentMove(cells: Mark[], size: number, rng: Rng): number {
  const empty: number[] = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === null) empty.push(i);
  }

  for (const i of empty) {
    if (wouldWin(cells, i, 'O', size)) return i;
  }
  for (const i of empty) {
    if (wouldWin(cells, i, 'X', size)) return i;
  }
  return pick(rng, empty);
}
