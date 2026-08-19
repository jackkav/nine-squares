import type { Mark } from './board';

export const SAVE_KEY = 'save';
export const SAVE_VERSION = 7;

/** The portion of GameState that's durable across reloads. */
export interface PersistedState {
  cells: Mark[];
  size: number;
  loopCount: number;
  totalGamesPlayed: number;
  winCount: number;
  lossCount: number;
  echoes: number;
  upgrades: Record<string, boolean>;
  fragments: string[];
  metaCurrency: number;
  tokens: number;
  claudeLevel: number;
  competitionLevel: number;
  cash: number;
  prestigeUpgrades: Record<string, boolean>;
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

interface SaveV5 {
  version: 5;
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

interface SaveV6 {
  version: 6;
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
  prestigeUpgrades: Record<string, boolean>;
}

interface SaveV7 extends PersistedState {
  version: 7;
}

type AnySave = SaveV1 | SaveV2 | SaveV3 | SaveV4 | SaveV5 | SaveV6 | SaveV7;

function migrate(save: AnySave): SaveV7 {
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
    return migrate({ ...save, version: 5, competitionLevel: 0, cash: 0 });
  }
  if (save.version === 5) {
    return migrate({ ...save, version: 6, prestigeUpgrades: {} });
  }
  if (save.version === 6) {
    return { ...save, version: 7, totalGamesPlayed: save.loopCount, winCount: 0, lossCount: 0 };
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
  const save: SaveV7 = { version: SAVE_VERSION, ...state };
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
