export interface PrestigeUpgradeDef {
  id: string;
  label: string;
  cost: number; // in sparks
}

// Permanent meta-upgrades, bought with sparks rather than echoes — unlike
// the regular upgrade shop, these survive prestige (they're what prestige
// is *for*).
export const PRESTIGE_UPGRADES: PrestigeUpgradeDef[] = [
  { id: 'widen', label: 'Widen the Grid', cost: 3 },
  { id: 'headstart', label: 'Head Start', cost: 2 },
];

export const WIDEN_BOARD_SIZE = 4;

// The board-size tradeoff made concrete: a wider board takes longer to
// fill, but pays out more per resolution once you're playing it.
export function sizeYieldMultiplier(size: number): number {
  return size >= WIDEN_BOARD_SIZE ? 1.5 : 1;
}

export const HEADSTART_ECHOES = 20;
