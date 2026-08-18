import { useRef, useState } from 'react';
import { checkWinner, emptyBoard, isDraw, type Mark } from './board';
import { getDebugNumberParam } from './debugParams';
import { echoesForOutcome, type Outcome } from './echoes';
import { fragmentsForLoopCount } from './fragments';
import { computeOpponentMove } from './opponent';
import { createRng } from './prng';
import { UPGRADES } from './upgrades';

const DEFAULT_BOARD_SIZE = 3;

export interface GameState {
  cells: Mark[];
  size: number;
  status: string;
  loopCount: number;
  echoes: number;
  upgrades: Record<string, boolean>;
  fragments: string[];
}

export function useGame(seed: string) {
  const rng = useRef(createRng(seed)).current;
  const [state, setState] = useState<GameState>(() => {
    const search = window.location.search;
    const loopCount = getDebugNumberParam(search, 'loop', 0);
    const size = getDebugNumberParam(search, 'board', DEFAULT_BOARD_SIZE);
    return {
      cells: emptyBoard(size),
      size,
      status: '',
      loopCount,
      echoes: getDebugNumberParam(search, 'echoes', 0),
      upgrades: {},
      fragments: fragmentsForLoopCount(loopCount),
    };
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
      setState(resolved(state, 'You closed the line.', 'win'));
      return;
    }
    if (isDraw(cells)) {
      setState(resolved(state, 'Nothing yields. A draw.', 'draw'));
      return;
    }

    const opponentMove = computeOpponentMove(cells, state.size, rng);
    cells = [...cells];
    cells[opponentMove] = 'O';

    winner = checkWinner(cells, state.size);
    if (winner === 'O') {
      setState(resolved(state, 'The opponent closed the line.', 'loss'));
      return;
    }
    if (isDraw(cells)) {
      setState(resolved(state, 'Nothing yields. A draw.', 'draw'));
      return;
    }

    setState({ ...state, cells });
  }

  function purchaseUpgrade(id: string) {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def || state.upgrades[id] || state.echoes < def.cost) return;

    const next: GameState = {
      ...state,
      echoes: state.echoes - def.cost,
      upgrades: { ...state.upgrades, [id]: true },
    };

    if (id === 'fourbyfour') {
      next.size = 4;
      next.cells = emptyBoard(4);
    }

    setState(next);
  }

  return { ...state, playCell, purchaseUpgrade };
}

function resolved(prev: GameState, status: string, outcome: Outcome): GameState {
  const loopCount = prev.loopCount + 1;
  return {
    ...prev,
    cells: emptyBoard(prev.size),
    status,
    loopCount,
    echoes: prev.echoes + echoesForOutcome(outcome),
    fragments: fragmentsForLoopCount(loopCount),
  };
}
