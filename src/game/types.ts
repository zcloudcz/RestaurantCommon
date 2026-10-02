import { offeredIds } from "../progression";
export type GameId = "pizza" | "burger";
export type Item = "raw" | "prep" | "meal" | "fries" | "trash";
export type Vec = { x: number; z: number };
export type Lang = "cs" | "en";
export type Text = { cs: string; en: string };
export interface StationDef extends Vec {
  id: string;
  kind: "source" | "convert" | "oven" | "counter";
  label: Text;
  input: Item | null;
  output: Item;
  seconds: number;
  batch: number;
  unlock: number;
}
export interface UnlockDef {
  name: Text;
  description: Text;
  cost: number;
  icon: string;
}
export interface GameDefinition {
  id: GameId;
  title: string;
  subtitle: Text;
  accent: string;
  dark: string;
  background: string;
  price: number;
  speed: number;
  stations: StationDef[];
  unlocks: UnlockDef[];
  recipes: Text[];
  recipeLevels: number[];
}
export interface Carrier extends Vec {
  item: Item | null;
  /** Total occupied tray slots; fries is the side portion of this total. */
  count: number;
  fries: number;
  angle: number;
  cooldown: number;
}
export interface StationState {
  id: string;
  input: number;
  output: number;
  timer: number;
  fries: number;
}
export interface Customer extends Vec {
  id: number;
  state: "queue" | "pay" | "eat" | "leave";
  count: number;
  timer: number;
  seat: number;
  drive: boolean;
  color: number;
  fries: number;
}
export interface Worker extends Carrier {
  /** Stable roster identity; older saves are assigned IDs during migration. */
  id?: string;
  role: "cook" | "server" | "cashier" | "cleaner";
  target: string;
}
export interface TableState {
  dirty: boolean;
  timer: number;
  customer: number;
}
export interface GameState {
  version: 1;
  id: GameId;
  time: number;
  money: number;
  earned: number;
  sold: number;
  served: number;
  cleaned: number;
  level: number;
  paid: number;
  owned?: number[];
  selected?: number;
  funding?: Record<number, number>;
  recipe: number;
  skin: number;
  tutorial: number;
  seed: number;
  nextId: number;
  spawn: number;
  cash: number;
  driveCash: number;
  payrollDebt: number;
  wagesPaid: number;
  player: Carrier;
  stations: StationState[];
  customers: Customer[];
  workers: Worker[];
  tables: TableState[];
  upgrades: {
    speed: number;
    capacity: number;
    income: number;
    production: number;
    staff: number;
    offline: number;
  };
  daily: {
    day: string;
    served: number;
    earned: number;
    cleaned: number;
    claimed: boolean[];
  };
}
export interface GameEvent extends Vec {
  type: "pickup" | "drop" | "sale" | "unlock" | "clean";
  amount: number;
  item?: Item;
}
export type GameCommand =
  | { type: "unlock"; index?: number }
  | { type: "upgrade"; id: keyof GameState["upgrades"] }
  | { type: "recipe" | "skin" | "claim"; index: number };
export const TABLES: Vec[] = [
  { x: 4, z: 3.3 },
  { x: 7, z: 3.3 },
  { x: 4, z: 7 },
  { x: 7, z: 7 },
  { x: 12, z: 3.3 },
  { x: 16, z: 3.3 },
  { x: 12, z: 7 },
  { x: 16, z: 7 },
  { x: 4, z: 13 },
  { x: 8, z: 13 },
  { x: 12, z: 13 },
  { x: 16, z: 13 },
  { x: -4, z: 13 },
  { x: 0, z: 13 },
];
export const tableCount = (level: Progress) =>
  hasExpansion(level, 17)
    ? 14
    : hasExpansion(level, 14)
      ? 12
      : hasExpansion(level, 13)
        ? 8
        : hasExpansion(level, 6)
          ? 4
          : hasExpansion(level, 2)
            ? 2
            : hasExpansion(level, 1)
              ? 1
              : 0;
/** Connected floor rectangles, shared by movement and the visible expansions. */
export function floorAreas(level: Progress) {
  const areas = [{ minX: -8.3, maxX: 8.3, minZ: -8.5, maxZ: 9 }];
  if (hasExpansion(level, 13))
    areas.push({ minX: 8.3, maxX: 18, minZ: 0, maxZ: 9 });
  if (hasExpansion(level, 14))
    areas.push({ minX: -8.3, maxX: 18, minZ: 9, maxZ: 17 });
  if (hasExpansion(level, 15))
    areas.push({ minX: -8.3, maxX: 8.3, minZ: -16, maxZ: -8.5 });
  if (hasExpansion(level, 16))
    areas.push({ minX: 8.3, maxX: 18, minZ: -8.5, maxZ: 0 });
  if (hasExpansion(level, 18))
    areas.push({ minX: -8.3, maxX: 18, minZ: 17, maxZ: 21 });
  return areas;
}
export const REGISTER: Vec = { x: 0, z: 0.5 };
export const TRASH: Vec = { x: -7, z: 7 };
export const PLOT: Vec = { x: 6, z: -1.8 };
export const HOME: Vec = { x: -2, z: -1 };

export type Progress = number | { level: number; owned?: number[] };
export const ownedIds = (s: Progress): number[] =>
  typeof s === "number"
    ? Array.from({ length: s }, (_, i) => i + 1)
    : (s.owned ?? ownedIds(s.level));
export const hasExpansion = (s: Progress, id: number): boolean =>
  id === 0 ||
  (typeof s === "number"
    ? s >= id
    : s.owned
      ? s.owned.includes(id)
      : s.level >= id);
/** Seating additions extend a contiguous table set; floor connections must exist. */
export const expansionDependencies: Record<number, number[]> = {
  2: [1],
  6: [2],
  13: [6],
  14: [13],
  16: [13],
  17: [14],
  18: [14],
};
export const expansionChoices = (s: Progress, total = 18): number[] =>
  offeredIds(total, ownedIds(s), expansionDependencies);
export const expansionPaid = (s: GameState, id: number): number =>
  s.funding?.[id] ?? (id === (s.selected ?? s.level + 1) ? s.paid : 0);
