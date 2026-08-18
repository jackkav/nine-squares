import { useRef, useState } from 'react';
import { checkWinner, emptyBoard, isDraw, type Mark } from './board';
import { computeOpponentMove } from './opponent';
import { createRng } from './prng';

const BOARD_SIZE = 3;

export interface GameState {
  cells: Mark[];
  size: number;
  status: string;
  loopCount: number;
}

export function useGame(seed: string) {
  const rng = useRef(createRng(seed)).current;
  const [state, setState] = useState<GameState>({
    cells: emptyBoard(BOARD_SIZE),
    size: BOARD_SIZE,
    status: '',
    loopCount: 0,
  });

  // Reads state directly (not via a setState functional updater) because
  // computing the opponent's move draws from a stateful RNG. Functional
  // updaters can be re-invoked by React (StrictMode does this in dev to
  // catch impure updates), which would silently burn an extra draw from
  // the seed and desync the game from anything computed against that seed
  // offline.
  function playCell(index: number) {
    if (state.cells[index] !== null) return;

    let cells = [...state.cells];
    cells[index] = 'X';

    let winner = checkWinner(cells, state.size);
    if (winner === 'X') {
      setState(resolved(state, 'You closed the line.'));
      return;
    }
    if (isDraw(cells)) {
      setState(resolved(state, 'Nothing yields. A draw.'));
      return;
    }

    const opponentMove = computeOpponentMove(cells, state.size, rng);
    cells = [...cells];
    cells[opponentMove] = 'O';

    winner = checkWinner(cells, state.size);
    if (winner === 'O') {
      setState(resolved(state, 'The opponent closed the line.'));
      return;
    }
    if (isDraw(cells)) {
      setState(resolved(state, 'Nothing yields. A draw.'));
      return;
    }

    setState({ ...state, cells });
  }

  return { ...state, playCell };
}

function resolved(prev: GameState, status: string): GameState {
  return {
    ...prev,
    cells: emptyBoard(prev.size),
    status,
    loopCount: prev.loopCount + 1,
  };
}
