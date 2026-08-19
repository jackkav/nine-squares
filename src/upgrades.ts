export interface UpgradeDef {
  id: string;
  label: string;
  cost: number;
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'autoplay', label: 'Claude', cost: 8 },
  { id: 'fourbyfour', label: 'Widen the Grid', cost: 40 },
];
