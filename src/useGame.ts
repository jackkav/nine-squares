import { useEffect, useRef, useState } from 'react';
import { checkWinner, emptyBoard, isDraw, type Mark } from './board';
import { getDebugListParam, getDebugNumberParam } from './debugParams';
import { echoesForOutcome, type Outcome } from './echoes';
import { fragmentsForLoopCount } from './fragments';
import {
  computeOfflineCredit,
  formatOfflineSummary,
  readLastSeen,
  writeLastSeen,
} from './offlineProgress';
import { computeOpponentMove } from './opponent';
import { createRng, type Rng } from './prng';
import { UPGRADES } from './upgrades';

const DEFAULT_BOARD_SIZE = 3;
const AUTOPLAY_INTERVAL_MS = 500;

export interface GameState {
  cells: Mark[];
  size: number;
  status: string;
  loopCount: number;
  echoes: number;
  upgrades: Record<string, boolean>;
  fragments: string[];
  offlineSummary: string | null;
}

/** Pure state transition for placing the player's mark at `index`, including
 * the opponent's reply. No side effects, so it's safe to call from anywhere
 * (a click handler, an automation timer) without StrictMode's double-invoke
 * of impure updates corrupting the RNG sequence. */
function applyMove(state: GameState, index: number, rng: Rng): GameState {
  if (state.cells[index] !== null) return state;

  let cells = [...state.cells];
  cells[index] = 'X';

  let winner = checkWinner(cells, state.size);
  if (winner === 'X') {
    return resolved({ ...state, cells }, 'You closed the line.', 'win');
  }
  if (isDraw(cells)) {
    return resolved({ ...state, cells }, 'Nothing yields. A draw.', 'draw');
  }

  const opponentMove = computeOpponentMove(cells, state.size, rng);
  cells = [...cells];
  cells[opponentMove] = 'O';

  winner = checkWinner(cells, state.size);
  if (winner === 'O') {
    return resolved({ ...state, cells }, 'The opponent closed the line.', 'loss');
  }
  if (isDraw(cells)) {
    return resolved({ ...state, cells }, 'Nothing yields. A draw.', 'draw');
  }

  return { ...state, cells };
}

export function useGame(seed: string) {
  const [rng] = useState(() => createRng(seed));
  const [state, setState] = useState<GameState>(() => {
    const search = window.location.search;
    const loopCount = getDebugNumberParam(search, 'loop', 0);
    const size = getDebugNumberParam(search, 'board', DEFAULT_BOARD_SIZE);
    const owned = getDebugListParam(search, 'owned');
    return {
      cells: emptyBoard(size),
      size,
      status: '',
      loopCount,
      echoes: getDebugNumberParam(search, 'echoes', 0),
      upgrades: Object.fromEntries(owned.map((id) => [id, true])),
      fragments: fragmentsForLoopCount(loopCount),
      offlineSummary: null,
    };
  });

  // Kept in sync with `state` on every render so the automation timer can
  // read the current game state without closing over a stale value, and so
  // that many synchronous timer firings within a single Playwright
  // clock.fastForward() burst each see the previous tick's result.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // setState here is called with an already-computed value, never a
  // functional updater — see the note on applyMove.
  function playCell(index: number) {
    setState(applyMove(state, index, rng));
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

  // "Steady Hand": plays the lowest-index empty cell on a timer once owned.
  useEffect(() => {
    if (!state.upgrades.autoplay) return;
    const id = setInterval(() => {
      const current = stateRef.current;
      const target = current.cells.findIndex((c) => c === null);
      if (target === -1) return;
      const next = applyMove(current, target, rng);
      stateRef.current = next;
      setState(next);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [state.upgrades.autoplay, rng]);

  // Offline progress: credited once per load, guarded against StrictMode's
  // dev-only double effect invocation with a ref rather than relying on the
  // effect only running once.
  const offlineCreditAppliedRef = useRef(false);
  useEffect(() => {
    if (offlineCreditAppliedRef.current) return;
    offlineCreditAppliedRef.current = true;

    const now = Date.now();
    const lastSeen = readLastSeen();
    if (lastSeen !== null && stateRef.current.upgrades.autoplay) {
      const credit = computeOfflineCredit(lastSeen, now);
      if (credit) {
        const next = { ...stateRef.current, echoes: stateRef.current.echoes + credit.echoes, offlineSummary: formatOfflineSummary(credit) };
        stateRef.current = next;
        setState(next);
      }
    }
    writeLastSeen(now);
  }, []);

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
