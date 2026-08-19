import type { Mark } from './board';

export const SAVE_KEY = 'save';
export const SAVE_VERSION = 5;

/** The portion of GameState that's durable across reloads. */
export interface PersistedState {
  cells: Mark[];
  size: number;
  loopCount: number;
  echoes: number;
  upgrades: Record<string, boolean>;
  fragments: string[];
  metaCurrency: number;
  tokens: number;
  claudeLevel: number;
  competitionLevel: number;
  cash: number;
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

interface SaveV2 {
  version: 2;
  cells: Mark[];
  size: number;
  loopCount: number;
  echoes: number;
  upgrades: Record<string, boolean>;
  fragments: string[];
}

interface SaveV3 {
  version: 3;
  cells: Mark[];
  size: number;
  loopCount: number;
  echoes: number;
  upgrades: Record<string, boolean>;
  fragments: string[];
  metaCurrency: number;
}

interface SaveV4 {
  version: 4;
  cells: Mark[];
  size: number;
  loopCount: number;
  echoes: number;
  upgrades: Record<string, boolean>;
  fragments: string[];
  metaCurrency: number;
  tokens: number;
  claudeLevel: number;
}

interface SaveV5 extends PersistedState {
  version: 5;
}

type AnySave = SaveV1 | SaveV2 | SaveV3 | SaveV4 | SaveV5;

function migrate(save: AnySave): SaveV5 {
  if (save.version === 1) {
    return migrate({
      version: 2,
      cells: save.cells,
      size: save.size,
      loopCount: save.loopCount,
      echoes: save.echoes,
      upgrades: Object.fromEntries(save.upgrades.map((id) => [id, true])),
      fragments: save.fragments,
    });
  }
  if (save.version === 2) {
    return migrate({ ...save, version: 3, metaCurrency: 0 });
  }
  if (save.version === 3) {
    return migrate({ ...save, version: 4, tokens: 0, claudeLevel: 0 });
  }
  if (save.version === 4) {
    return { ...save, version: 5, competitionLevel: 0, cash: 0 };
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
  const save: SaveV5 = { version: SAVE_VERSION, ...state };
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
