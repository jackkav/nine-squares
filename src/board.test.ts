import { describe, expect, it } from 'vitest';
import { checkWinner, emptyBoard, isDraw, wouldWin, type Mark } from './board';

function place(size: number, marks: Record<number, 'X' | 'O'>): Mark[] {
  const cells = emptyBoard(size);
  for (const [index, mark] of Object.entries(marks)) {
    cells[Number(index)] = mark;
  }
  return cells;
}

describe('checkWinner: N=3', () => {
  it('detects no winner on an empty board', () => {
    expect(checkWinner(emptyBoard(3), 3)).toBeNull();
  });

  it.each([
    ['row 0', { 0: 'X', 1: 'X', 2: 'X' }],
    ['row 1', { 3: 'X', 4: 'X', 5: 'X' }],
    ['row 2', { 6: 'X', 7: 'X', 8: 'X' }],
    ['col 0', { 0: 'X', 3: 'X', 6: 'X' }],
    ['col 1', { 1: 'X', 4: 'X', 7: 'X' }],
    ['col 2', { 2: 'X', 5: 'X', 8: 'X' }],
    ['diagonal', { 0: 'X', 4: 'X', 8: 'X' }],
    ['anti-diagonal', { 2: 'X', 4: 'X', 6: 'X' }],
  ] as const)('detects a win on %s', (_label, marks) => {
    expect(checkWinner(place(3, marks), 3)).toBe('X');
  });

  it('does not report a winner for a near-complete line', () => {
    const cells = place(3, { 0: 'X', 1: 'X', 2: null as unknown as 'X' });
    expect(checkWinner(cells, 3)).toBeNull();
  });

  it('detects O as the winner independently of X marks elsewhere', () => {
    const cells = place(3, { 0: 'O', 3: 'O', 6: 'O', 1: 'X', 2: 'X' });
    expect(checkWinner(cells, 3)).toBe('O');
  });
});

describe('checkWinner: N=4', () => {
  it.each([
    ['row 0', { 0: 'X', 1: 'X', 2: 'X', 3: 'X' }],
    ['row 3', { 12: 'X', 13: 'X', 14: 'X', 15: 'X' }],
    ['col 0', { 0: 'X', 4: 'X', 8: 'X', 12: 'X' }],
    ['col 3', { 3: 'X', 7: 'X', 11: 'X', 15: 'X' }],
    ['diagonal', { 0: 'X', 5: 'X', 10: 'X', 15: 'X' }],
    ['anti-diagonal', { 3: 'X', 6: 'X', 9: 'X', 12: 'X' }],
  ] as const)('detects a win on %s', (_label, marks) => {
    expect(checkWinner(place(4, marks), 4)).toBe('X');
  });

  it('a completed 3x3-style diagonal within a 4x4 board is not a win', () => {
    // (0,4,8) reads as a diagonal on a 3-wide board but is not a line on a
    // 4-wide one — a regression guard against hardcoded 3x3 line math.
    const cells = place(4, { 0: 'X', 4: 'X', 8: 'X' });
    expect(checkWinner(cells, 4)).toBeNull();
  });

  it('three in a row on a 4x4 board is not yet a win', () => {
    const cells = place(4, { 0: 'X', 1: 'X', 2: 'X' });
    expect(checkWinner(cells, 4)).toBeNull();
  });
});

describe('wouldWin', () => {
  it('reports true only for the cell that completes a line', () => {
    const cells = place(3, { 0: 'X', 1: 'X' });
    expect(wouldWin(cells, 2, 'X', 3)).toBe(true);
    expect(wouldWin(cells, 5, 'X', 3)).toBe(false);
  });

  it('returns false for an already-occupied cell', () => {
    const cells = place(3, { 0: 'X', 1: 'X' });
    expect(wouldWin(cells, 0, 'X', 3)).toBe(false);
  });
});

describe('isDraw', () => {
  it('is false while any cell is empty', () => {
    expect(isDraw(place(3, { 0: 'X' }))).toBe(false);
  });

  it('is true once every cell is filled', () => {
    const cells = emptyBoard(3).map((_, i) => (i % 2 === 0 ? 'X' : 'O')) as Mark[];
    expect(isDraw(cells)).toBe(true);
  });
});
