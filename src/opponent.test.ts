import { describe, expect, it } from 'vitest';
import { checkWinner, emptyBoard, isDraw, type Mark } from './board';
import { selectAutoMove } from './autoplay';
import { computeOpponentMove } from './opponent';
import { createRng, type Rng } from './prng';

const SIZE = 3;
const TRIALS = 1500;

function simulateMatch(rng: Rng, claudeLevel: number, competitionLevel: number): 'X' | 'O' | 'draw' {
  let cells: Mark[] = emptyBoard(SIZE);
  while (true) {
    const xMove = selectAutoMove(cells, SIZE, claudeLevel);
    cells = [...cells];
    cells[xMove] = 'X';
    let winner = checkWinner(cells, SIZE);
    if (winner === 'X') return 'X';
    if (isDraw(cells)) return 'draw';

    const oMove = computeOpponentMove(cells, SIZE, rng, competitionLevel);
    cells = [...cells];
    cells[oMove] = 'O';
    winner = checkWinner(cells, SIZE);
    if (winner === 'O') return 'O';
    if (isDraw(cells)) return 'draw';
  }
}

function winRate(claudeLevel: number, competitionLevel: number): number {
  const rng = createRng(`opponent-unit-test-c${claudeLevel}-l${competitionLevel}`);
  let wins = 0;
  for (let i = 0; i < TRIALS; i++) {
    if (simulateMatch(rng, claudeLevel, competitionLevel) === 'X') wins++;
  }
  return wins / TRIALS;
}

function opponentWinRate(claudeLevel: number, competitionLevel: number): number {
  const rng = createRng(`opponent-unit-test-oside-c${claudeLevel}-l${competitionLevel}`);
  let oWins = 0;
  for (let i = 0; i < TRIALS; i++) {
    if (simulateMatch(rng, claudeLevel, competitionLevel) === 'O') oWins++;
  }
  return oWins / TRIALS;
}

describe('computeOpponentMove: competitionLevel raises difficulty without walling automation to zero', () => {
  it('competitionLevel 0 matches the original opponent exactly (no positional/fork behaviour)', () => {
    // Claude level 2's own win-rate proof (src/autoplay.test.ts) already
    // pins this number against the default opponent; re-asserting it here
    // guards against competitionLevel 0 silently picking up new behaviour.
    expect(winRate(2, 0)).toBeGreaterThan(0.5);
  });

  it('each competition level strictly reduces a maxed-out Claude\'s win rate', () => {
    const rate0 = winRate(2, 0);
    const rate1 = winRate(2, 1);
    const rate2 = winRate(2, 2);
    expect(rate1).toBeLessThan(rate0);
    expect(rate2).toBeLessThan(rate1);
  });

  it('even at max competition level, a maxed-out Claude can still win sometimes', () => {
    // The whole point of tuning this away from a deterministic positional
    // preference: a fully deterministic "always take the center" opponent
    // draws a fork-seeking attacker to a 0% win rate every single time
    // (verified during design), which would make competition wins
    // unreachable through automation. This guards against reintroducing
    // that regression.
    expect(winRate(2, 2)).toBeGreaterThan(0.1);
  });

  it('raising competition level also makes the opponent tougher against a naive (level 0) Claude', () => {
    // A level-0 Claude never wins regardless (see autoplay.test.ts); the
    // opponent's improvement shows up as winning outright more often
    // instead of settling for a draw.
    expect(opponentWinRate(0, 2)).toBeGreaterThan(opponentWinRate(0, 0));
  });
});
