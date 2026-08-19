import {
  centerIndex,
  cornerIndices,
  countThreatsAfter,
  emptyIndices,
  wouldWin,
  type Mark,
} from './board';

/**
 * Chooses Claude's move against the built-in opponent (win > block >
 * random). Level 0 is the original "lowest empty index" behaviour. Level 1
 * gives Claude the same win/block awareness the opponent has. Level 2 adds
 * fork-seeking and positional preference (center, then corners), which is
 * what actually starts winning consistently, since the opponent itself
 * never looks for forks either. See scratch/autoplay-win-rate.ts for the
 * simulation this is tuned against.
 */
export function selectAutoMove(cells: Mark[], size: number, claudeLevel: number): number {
  const empty = emptyIndices(cells);

  if (claudeLevel >= 1) {
    for (const i of empty) {
      if (wouldWin(cells, i, 'X', size)) return i;
    }
    for (const i of empty) {
      if (wouldWin(cells, i, 'O', size)) return i;
    }
  }

  if (claudeLevel >= 2) {
    for (const i of empty) {
      if (countThreatsAfter(cells, i, 'X', size) >= 2) return i;
    }
    const center = centerIndex(size);
    if (center >= 0 && cells[center] === null) return center;
    for (const i of cornerIndices(size)) {
      if (cells[i] === null) return i;
    }
  }

  return empty[0];
}
