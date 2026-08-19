export type Mark = 'X' | 'O' | null;

export function emptyBoard(size: number): Mark[] {
  return Array.from({ length: size * size }, () => null);
}

/** Row, column, and both diagonal index groups for an N x N board. */
function getLines(size: number): number[][] {
  const lines: number[][] = [];
  for (let r = 0; r < size; r++) {
    lines.push(Array.from({ length: size }, (_, c) => r * size + c));
  }
  for (let c = 0; c < size; c++) {
    lines.push(Array.from({ length: size }, (_, r) => r * size + c));
  }
  lines.push(Array.from({ length: size }, (_, i) => i * size + i));
  lines.push(Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)));
  return lines;
}

export function checkWinner(cells: Mark[], size: number): 'X' | 'O' | null {
  for (const line of getLines(size)) {
    const first = cells[line[0]];
    if (first && line.every((i) => cells[i] === first)) {
      return first;
    }
  }
  return null;
}

export function isDraw(cells: Mark[]): boolean {
  return cells.every((c) => c !== null);
}

export function wouldWin(cells: Mark[], index: number, mark: 'X' | 'O', size: number): boolean {
  if (cells[index] !== null) return false;
  const next = [...cells];
  next[index] = mark;
  return checkWinner(next, size) === mark;
}

export function emptyIndices(cells: Mark[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === null) out.push(i);
  }
  return out;
}

/** How many different remaining cells would complete a line for `mark` if
 * `index` were played now. 2+ means placing there creates a fork. */
export function countThreatsAfter(cells: Mark[], index: number, mark: 'X' | 'O', size: number): number {
  if (cells[index] !== null) return 0;
  const next = [...cells];
  next[index] = mark;
  let count = 0;
  for (const i of emptyIndices(next)) {
    if (wouldWin(next, i, mark, size)) count++;
  }
  return count;
}
