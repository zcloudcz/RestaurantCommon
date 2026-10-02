import { expansionChoices, expansionPaid, ownedIds } from "./types";
import { hasExpansion } from "./types";
import {
  HOME,
  TABLES,
  PLOT,
  type GameDefinition,
  type GameState,
  type GameCommand,
  type Vec,
  type GameEvent,
} from "./types";
import { move, distance, walkable } from "./navigation";
import { produce, interact } from "./production";
import { customers } from "./customers";
import { staff, settlePayroll } from "./staff";
export function createGame(d: GameDefinition): GameState {
  return {
    version: 1,
    id: d.id,
    time: 0,
    money: 0,
    earned: 0,
    sold: 0,
    served: 0,
    cleaned: 0,
    level: 0,
    paid: 0,
    recipe: 0,
    skin: 0,
    tutorial: 0,
    seed: 42,
    nextId: 1,
    spawn: 0,
    cash: 0,
    driveCash: 0,
    payrollDebt: 0,
    wagesPaid: 0,
    player: { ...HOME, item: null, count: 0, fries: 0, angle: 0, cooldown: 0 },
    stations: d.stations.map((x) => ({
      id: x.id,
      input: 0,
      output: x.kind === "source" ? 5 : 0,
      timer: 0,
      fries: 0,
    })),
    customers: [],
    workers: [],
    tables: Array.from({ length: TABLES.length }, () => ({
      dirty: false,
      timer: 0,
      customer: -1,
    })),
    upgrades: {
      speed: 0,
      capacity: 0,
      income: 0,
      production: 0,
      staff: 0,
      offline: 0,
    },
    daily: {
      day: new Date().toISOString().slice(0, 10),
      served: 0,
      earned: 0,
      cleaned: 0,
      claimed: [false, false, false],
    },
  };
}
export function upgradeCost(
  s: GameState,
  id: keyof GameState["upgrades"],
): number {
  return Math.round(
    {
      speed: 50,
      capacity: 70,
      income: 100,
      production: 90,
      staff: 120,
      offline: 150,
    }[id] *
      1.65 ** s.upgrades[id],
  );
}
export function command(
  s: GameState,
  d: GameDefinition,
  a: GameCommand,
): boolean {
  settlePayroll(s);
  if (a.type === "unlock") {
    const id = a.index ?? expansionChoices(s, d.unlocks.length)[0];
    if (!expansionChoices(s, d.unlocks.length).includes(id) || s.money < 1)
      return false;
    const legacyId = s.selected ?? s.level + 1;
    s.funding ??= s.paid ? { [legacyId]: s.paid } : {};
    s.owned ??= ownedIds(s);
    s.selected = id;
    s.paid = s.funding[id] ?? 0;
    const next = d.unlocks[id - 1];
    const pay = Math.min(s.money, next.cost - s.paid);
    s.money -= pay;
    s.paid += pay;
    s.funding[id] = s.paid;
    if (s.paid >= next.cost) completeExpansion(s, d, id);
    return true;
  }

  if (a.type === "upgrade") {
    const cost = upgradeCost(s, a.id);
    if (s.upgrades[a.id] >= 5 || s.money < cost) return false;
    s.money -= cost;
    s.upgrades[a.id]++;
    return true;
  }
  if (a.type === "recipe") {
    if (
      !Number.isInteger(a.index) ||
      a.index < 0 ||
      a.index >= d.recipes.length ||
      !hasExpansion(s, d.recipeLevels[a.index])
    )
      return false;
    s.recipe = a.index;
    return true;
  }
  if (a.type === "skin") {
    if (!Number.isInteger(a.index) || a.index < 0 || a.index > 2) return false;
    s.skin = a.index;
    return true;
  }
  if (a.type === "claim") {
    const values = [s.daily.served, s.daily.earned, s.daily.cleaned],
      goals = [20, 500, 8];
    if (
      a.index < 0 ||
      a.index > 2 ||
      !Number.isInteger(a.index) ||
      s.daily.claimed[a.index] ||
      values[a.index] < goals[a.index]
    )
      return false;
    s.daily.claimed[a.index] = true;
    s.money += [100, 180, 120][a.index];
    return true;
  }
  return false;
}
export function refreshDay(s: GameState, now: number) {
  const day = new Date(now).toISOString().slice(0, 10);
  if (day > s.daily.day)
    s.daily = {
      day,
      served: 0,
      earned: 0,
      cleaned: 0,
      claimed: [false, false, false],
    };
}
export function step(
  s: GameState,
  d: GameDefinition,
  input: Vec,
  dt: number,
): GameEvent[] {
  if (!Number.isFinite(dt) || dt <= 0) return [];
  dt = Math.min(dt, 0.1);
  s.time += dt;
  const events: GameEvent[] = [];
  if (Number.isFinite(input.x) && Number.isFinite(input.z)) {
    move(s.player, input, d.speed * (1 + s.upgrades.speed * 0.14) * dt, d, s);
    if (Math.hypot(input.x, input.z) > 0.01)
      s.player.angle = Math.atan2(input.x, input.z);
  }
  produce(s, d, dt);
  interact(s, d, s.player, events, dt);
  staff(s, d, dt, events);
  customers(s, d, dt, events);
  settlePayroll(s);
  if (
    s.selected &&
    distance(s.player, PLOT) < 1 &&
    s.money > 0 &&
    expansionChoices(s, d.unlocks.length).includes(s.selected)
  ) {
    const id = s.selected,
      next = d.unlocks[id - 1];
    const pay = Math.min(s.money, next.cost - s.paid, (next.cost * dt) / 2);
    s.money -= pay;
    s.paid += pay;
    (s.funding ??= {})[id] = s.paid;
    if (s.paid >= next.cost - 0.001) {
      completeExpansion(s, d, id);
      events.push({ ...PLOT, type: "unlock", amount: 1 });
    }
  }
  return events;
}

/** Furniture can appear where an actor stood before the purchase. */
function settleExpansion(s: GameState, d: GameDefinition): void {
  for (const actor of [s.player, ...s.workers]) {
    if (walkable(actor, d, 0, s)) continue;
    const origin = { x: actor.x, z: actor.z };
    let found = false;
    for (let radius = 0.5; radius <= 3 && !found; radius += 0.5) {
      for (const [x, z] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ]) {
        const point = { x: origin.x + x * radius, z: origin.z + z * radius };
        if (walkable(point, d, 0.16, s)) {
          Object.assign(actor, point);
          found = true;
          break;
        }
      }
    }
    if (!found) Object.assign(actor, HOME);
  }
}

function completeExpansion(s: GameState, d: GameDefinition, id: number) {
  s.owned ??= ownedIds(s);
  s.owned.push(id);
  s.level = s.owned.length;
  delete s.funding?.[id];
  s.selected = undefined;
  s.paid = 0;
  settleExpansion(s, d);
}
