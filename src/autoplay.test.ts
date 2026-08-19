import { describe, expect, it } from 'vitest';
import { checkWinner, emptyBoard, isDraw, type Mark } from './board';
import { selectAutoMove } from './autoplay';
import { computeOpponentMove } from './opponent';
import { createRng, type Rng } from './prng';

const SIZE = 3;
const TRIALS = 2000;

function simulateMatch(rng: Rng, level: number): 'X' | 'O' | 'draw' {
  let cells: Mark[] = emptyBoard(SIZE);
  while (true) {
    const xMove = selectAutoMove(cells, SIZE, level);
    cells = [...cells];
    cells[xMove] = 'X';
    let winner = checkWinner(cells, SIZE);
    if (winner === 'X') return 'X';
    if (isDraw(cells)) return 'draw';

    const oMove = computeOpponentMove(cells, SIZE, rng);
    cells = [...cells];
    cells[oMove] = 'O';
    winner = checkWinner(cells, SIZE);
    if (winner === 'O') return 'O';
    if (isDraw(cells)) return 'draw';
  }
}

function winRate(level: number): number {
  const rng = createRng(`autoplay-unit-test-level-${level}`);
  let wins = 0;
  for (let i = 0; i < TRIALS; i++) {
    if (simulateMatch(rng, level) === 'X') wins++;
  }
  return wins / TRIALS;
}

function lossRate(level: number): number {
  const rng = createRng(`autoplay-unit-test-loss-level-${level}`);
  let losses = 0;
  for (let i = 0; i < TRIALS; i++) {
    if (simulateMatch(rng, level) === 'O') losses++;
  }
  return losses / TRIALS;
}

describe('selectAutoMove: level progression measurably improves outcomes', () => {
  it('level 0 (lowest-empty-index) never wins against the built-in opponent', () => {
    expect(winRate(0)).toBe(0);
  });

  it('each level wins strictly more often than the one before it', () => {
    const rate0 = winRate(0);
    const rate1 = winRate(1);
    const rate2 = winRate(2);
    expect(rate1).toBeGreaterThan(rate0);
    expect(rate2).toBeGreaterThan(rate1);
  });

  it('level 2 (fork-seeking) never loses to the built-in opponent', () => {
    expect(lossRate(2)).toBe(0);
  });
});
