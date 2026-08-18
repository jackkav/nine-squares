import type { Mark } from './board';

export const SAVE_KEY = 'save';
export const SAVE_VERSION = 2;

/** The portion of GameState that's durable across reloads. */
export interface PersistedState {
  cells: Mark[];
  size: number;
  loopCount: number;
  echoes: number;
  upgrades: Record<string, boolean>;
  fragments: string[];
}

interface SaveV1 {
  version: 1;
  cells: Mark[];
  size: number;
  loopCount: number;
  echoes: number;
  upgrades: string[]; // owned ids, pre-dating the owned/available data-state distinction
  fragments: string[];
}

interface SaveV2 extends PersistedState {
  version: 2;
}

type AnySave = SaveV1 | SaveV2;

function migrate(save: AnySave): SaveV2 {
  if (save.version === 1) {
    return {
      version: 2,
      cells: save.cells,
      size: save.size,
      loopCount: save.loopCount,
      echoes: save.echoes,
      upgrades: Object.fromEntries(save.upgrades.map((id) => [id, true])),
      fragments: save.fragments,
    };
  }
  return save;
}

export function loadSave(): PersistedState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AnySave;
    const { version: _version, ...state } = migrate(parsed);
    return state;
  } catch {
    return null;
  }
}

export function writeSave(state: PersistedState): void {
  const save: SaveV2 = { version: SAVE_VERSION, ...state };
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
