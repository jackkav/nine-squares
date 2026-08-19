import { useEffect, useRef, useState } from 'react';
import { checkWinner, emptyBoard, isDraw, type Mark } from './board';
import { selectAutoMove } from './autoplay';
import {
  autoplayIntervalMs,
  claudeLevelUpCost,
  MAX_CLAUDE_LEVEL,
  TOKENS_PER_AUTO_RESOLUTION,
} from './claude';
import { cashPrizeForLevel, competitionLevelUpCost, MAX_COMPETITION_LEVEL } from './competition';
import { getDebugListParam, getDebugNumberParam } from './debugParams';
import { echoesForOutcome, type Outcome } from './echoes';
import { fragmentsForLoopCount, mergeFragments } from './fragments';
import {
  computeOfflineCredit,
  formatOfflineSummary,
  readLastSeen,
  writeLastSeen,
} from './offlineProgress';
import { computeOpponentMove } from './opponent';
import { loadSave, writeSave, type PersistedState } from './persistence';
import { multiplierForSparks, sparksForPrestige } from './prestige';
import { HEADSTART_ECHOES, PRESTIGE_UPGRADES, sizeYieldMultiplier, WIDEN_BOARD_SIZE } from './prestigeShop';
import { createRng, type Rng } from './prng';
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
  offlineSummary: string | null;
  metaCurrency: number;
  tokens: number;
  claudeLevel: number;
  competitionLevel: number;
  cash: number;
  prestigeUpgrades: Record<string, boolean>;
}

function startingBoardSize(prestigeUpgrades: Record<string, boolean>): number {
  return prestigeUpgrades.widen ? WIDEN_BOARD_SIZE : DEFAULT_BOARD_SIZE;
}

function startingEchoes(prestigeUpgrades: Record<string, boolean>): number {
  return prestigeUpgrades.headstart ? HEADSTART_ECHOES : 0;
}

type MoveSource = 'manual' | 'auto';

/** Pure state transition for placing the player's mark at `index`, including
 * the opponent's reply. No side effects, so it's safe to call from anywhere
 * (a click handler, an automation timer) without StrictMode's double-invoke
 * of impure updates corrupting the RNG sequence. */
function applyMove(state: GameState, index: number, rng: Rng, source: MoveSource = 'manual'): GameState {
  if (state.cells[index] !== null) return state;

  let cells = [...state.cells];
  cells[index] = 'X';

  let winner = checkWinner(cells, state.size);
  if (winner === 'X') {
    return resolved({ ...state, cells }, 'You closed the line.', 'win', source);
  }
  if (isDraw(cells)) {
    return resolved({ ...state, cells }, 'Nothing yields. A draw.', 'draw', source);
  }

  const opponentMove = computeOpponentMove(cells, state.size, rng, state.competitionLevel);
  cells = [...cells];
  cells[opponentMove] = 'O';

  winner = checkWinner(cells, state.size);
  if (winner === 'O') {
    return resolved({ ...state, cells }, 'The opponent closed the line.', 'loss', source);
  }
  if (isDraw(cells)) {
    return resolved({ ...state, cells }, 'Nothing yields. A draw.', 'draw', source);
  }

  return { ...state, cells };
}

export function useGame(seed: string) {
  const [rng] = useState(() => createRng(seed));
  const [state, setState] = useState<GameState>(() => {
    // A persisted save is the source of truth once one exists — debug
    // params only seed a genuinely fresh run (see the D8 commit for why:
    // otherwise reloading a URL with ?echoes= would stomp real progress).
    const save = loadSave();
    if (save) {
      return { ...save, status: '', offlineSummary: null };
    }

    const search = window.location.search;
    const loopCount = getDebugNumberParam(search, 'loop', 0);
    const owned = getDebugListParam(search, 'owned');
    const prestigeOwned = getDebugListParam(search, 'prestigeOwned');
    const prestigeUpgrades = Object.fromEntries(prestigeOwned.map((id) => [id, true]));
    const size = getDebugNumberParam(search, 'board', startingBoardSize(prestigeUpgrades));
    return {
      cells: emptyBoard(size),
      size,
      status: '',
      loopCount,
      echoes: getDebugNumberParam(search, 'echoes', startingEchoes(prestigeUpgrades)),
      upgrades: Object.fromEntries(owned.map((id) => [id, true])),
      fragments: fragmentsForLoopCount(loopCount),
      offlineSummary: null,
      metaCurrency: getDebugNumberParam(search, 'sparks', 0),
      tokens: getDebugNumberParam(search, 'tokens', 0),
      claudeLevel: getDebugNumberParam(search, 'claudeLevel', 0),
      competitionLevel: getDebugNumberParam(search, 'competitionLevel', 0),
      cash: getDebugNumberParam(search, 'cash', 0),
      prestigeUpgrades,
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

  // Persists on every change. `status` and `offlineSummary` are
  // deliberately excluded: they're transient, session-scoped notices, not
  // durable progress — persisting offlineSummary in particular would make
  // the "while you were away" banner reappear on every reload instead of
  // just the one after a genuine absence.
  useEffect(() => {
    const persisted: PersistedState = {
      cells: state.cells,
      size: state.size,
      loopCount: state.loopCount,
      echoes: state.echoes,
      upgrades: state.upgrades,
      fragments: state.fragments,
      metaCurrency: state.metaCurrency,
      tokens: state.tokens,
      claudeLevel: state.claudeLevel,
      competitionLevel: state.competitionLevel,
      cash: state.cash,
      prestigeUpgrades: state.prestigeUpgrades,
    };
    writeSave(persisted);
  }, [
    state.cells,
    state.size,
    state.loopCount,
    state.echoes,
    state.upgrades,
    state.fragments,
    state.metaCurrency,
    state.tokens,
    state.claudeLevel,
    state.competitionLevel,
    state.cash,
    state.prestigeUpgrades,
  ]);

  // setState here is called with an already-computed value, never a
  // functional updater — see the note on applyMove.
  function playCell(index: number) {
    setState(applyMove(state, index, rng));
  }

  function purchaseUpgrade(id: string) {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def || state.upgrades[id] || state.echoes < def.cost) return;
    setState({
      ...state,
      echoes: state.echoes - def.cost,
      upgrades: { ...state.upgrades, [id]: true },
    });
  }

  function purchasePrestigeUpgrade(id: string) {
    const def = PRESTIGE_UPGRADES.find((u) => u.id === id);
    if (!def || state.prestigeUpgrades[id] || state.metaCurrency < def.cost) return;

    const next: GameState = {
      ...state,
      metaCurrency: state.metaCurrency - def.cost,
      prestigeUpgrades: { ...state.prestigeUpgrades, [id]: true },
    };

    // Widening takes effect on the current board immediately, in addition
    // to becoming the default for every future run (see prestige()).
    if (id === 'widen') {
      next.size = WIDEN_BOARD_SIZE;
      next.cells = emptyBoard(WIDEN_BOARD_SIZE);
    }

    setState(next);
  }

  function prestige() {
    const gain = sparksForPrestige(state.loopCount);
    const size = startingBoardSize(state.prestigeUpgrades);
    setState({
      ...state,
      cells: emptyBoard(size),
      size,
      status: '',
      loopCount: 0,
      echoes: startingEchoes(state.prestigeUpgrades),
      upgrades: {},
      // Claude and competition are both bought and leveled with run-scoped
      // currencies (echoes, tokens, cash), so they reset alongside them
      // rather than with fragments, metaCurrency, and prestigeUpgrades,
      // which are the only things meta-scoped here.
      tokens: 0,
      claudeLevel: 0,
      competitionLevel: 0,
      cash: 0,
      metaCurrency: state.metaCurrency + gain,
    });
  }

  function purchaseClaudeLevel() {
    if (!state.upgrades.autoplay || state.claudeLevel >= MAX_CLAUDE_LEVEL) return;
    const cost = claudeLevelUpCost(state.claudeLevel);
    if (cost === null || state.tokens < cost) return;
    setState({ ...state, tokens: state.tokens - cost, claudeLevel: state.claudeLevel + 1 });
  }

  function purchaseCompetitionLevel() {
    if (state.competitionLevel >= MAX_COMPETITION_LEVEL) return;
    const cost = competitionLevelUpCost(state.competitionLevel);
    if (cost === null || state.echoes < cost) return;
    setState({ ...state, echoes: state.echoes - cost, competitionLevel: state.competitionLevel + 1 });
  }

  // Claude: plays a move on a timer once owned, using selectAutoMove tuned
  // to its purchased level (0 = original lowest-empty-index behaviour).
  // The interval itself also shortens per level (autoplayIntervalMs), so
  // the effect must re-run — clearing and recreating the timer — whenever
  // claudeLevel changes, not just when autoplay is first owned.
  useEffect(() => {
    if (!state.upgrades.autoplay) return;
    const id = setInterval(() => {
      const current = stateRef.current;
      const target = selectAutoMove(current.cells, current.size, current.claudeLevel);
      if (target === undefined || current.cells[target] !== null) return;
      const next = applyMove(current, target, rng, 'auto');
      stateRef.current = next;
      setState(next);
    }, autoplayIntervalMs(state.claudeLevel));
    return () => clearInterval(id);
  }, [state.upgrades.autoplay, state.claudeLevel, rng]);

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

  return {
    ...state,
    playCell,
    purchaseUpgrade,
    prestige,
    purchaseClaudeLevel,
    purchaseCompetitionLevel,
    purchasePrestigeUpgrade,
  };
}

function resolved(prev: GameState, status: string, outcome: Outcome, source: MoveSource): GameState {
  const loopCount = prev.loopCount + 1;
  const yieldMultiplier = multiplierForSparks(prev.metaCurrency) * sizeYieldMultiplier(prev.size);
  return {
    ...prev,
    cells: emptyBoard(prev.size),
    status,
    loopCount,
    echoes: prev.echoes + Math.round(echoesForOutcome(outcome) * yieldMultiplier),
    // Tokens are a byproduct of Claude's own play, not the player's — they
    // fund leveling Claude up further, independent of manual sessions.
    tokens: prev.tokens + (source === 'auto' ? TOKENS_PER_AUTO_RESOLUTION : 0),
    // Cash pays out for a win regardless of who played it (manual or
    // Claude) — competing is the point, not who does the clicking.
    cash: prev.cash + (outcome === 'win' ? cashPrizeForLevel(prev.competitionLevel) : 0),
    fragments: mergeFragments(prev.fragments, loopCount),
  };
}
