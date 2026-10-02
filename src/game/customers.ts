import { hasExpansion } from "./types";
import {
  REGISTER,
  TABLES,
  type GameState,
  type GameDefinition,
  type GameEvent,
} from "./types";
import { distance, toward, walkable } from "./navigation";
import { seats } from "./production";
export function random(s: GameState): number {
  s.seed = (Math.imul(1664525, s.seed) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
export function price(s: GameState, d: GameDefinition) {
  return Math.round(
    d.price *
      (1 + s.upgrades.income * 0.2) *
      (1 + s.recipe * 0.25) *
      (hasExpansion(s, 17) ? 1.2 : 1),
  );
}
export const friesPrice = (s: GameState) =>
  Math.round(
    4 * (1 + s.upgrades.income * 0.2) * (hasExpansion(s, 17) ? 1.2 : 1),
  );
export function customers(
  s: GameState,
  d: GameDefinition,
  dt: number,
  events: GameEvent[],
): void {
  s.spawn = Math.max(0, s.spawn - dt);
  if (
    s.spawn <= 0 &&
    s.customers.length < 40 &&
    s.customers.filter((c) => c.state === "queue").length < 6
  ) {
    s.spawn = Math.max(2.2, 5 - s.level * 0.18);
    const drive = hasExpansion(s, 9) && random(s) > 0.65;
    s.customers.push({
      id: s.nextId++,
      x: drive ? -11 : -4,
      z: drive ? 8 : 10.5,
      state: "queue",
      count: 1 + Math.floor(random(s) * Math.min(4, 1 + s.level / 3)),
      timer: 0,
      seat: -1,
      drive,
      color: Math.floor(random(s) * 6),
      fries: 0,
    });
  }
  let regular = 0,
    drivers = 0,
    express = 0;
  for (const c of s.customers) {
    c.timer += dt;
    const dispatch = !c.drive && hasExpansion(s, 16) && c.id % 3 === 0;
    if (c.state === "queue") {
      const rank = c.drive ? drivers++ : dispatch ? express++ : regular++;
      const destination = c.drive
        ? { x: -10, z: -1.5 + rank * 2.3 }
        : dispatch
          ? { x: 13 + rank * 0.7, z: -3.5 }
          : { x: -5, z: 3.7 + rank * 1.05 };
      toward(
        c,
        destination,
        2.5,
        dt,
        !c.drive && walkable(c, d, 0, s) && walkable(destination, d, 0, s)
          ? d
          : undefined,
        s,
      );
      const station = s.stations.find(
        (x) => x.id === (c.drive ? "drive" : dispatch ? "dispatch" : "counter"),
      );
      if (
        rank === 0 &&
        distance(c, destination) < 0.2 &&
        station &&
        station.output >= c.count
      ) {
        station.output -= c.count;
        c.fries =
          d.id === "burger" && hasExpansion(s, 3)
            ? Math.min(c.count, station.fries)
            : 0;
        station.fries -= c.fries;
        c.state = "pay";
        c.timer = 0;
      } else if (c.timer > 60) {
        c.state = "leave";
        c.timer = 0;
      }
    } else if (c.state === "pay") {
      const destination = c.drive
        ? { x: -10, z: -3.6 }
        : dispatch
          ? { x: 13, z: -2 }
          : { x: 0, z: 3.5 };
      toward(c, destination, 2.7, dt, !c.drive ? d : undefined, s);
      const attended = c.drive
        ? hasExpansion(s, 11) || distance(s.player, { x: -7, z: 0 }) < 1.2
        : hasExpansion(s, 5) || distance(s.player, REGISTER) < 1.3;
      if (attended && distance(c, destination) < 0.2 && c.timer > 0.5) {
        const amount = c.count * price(s, d) + c.fries * friesPrice(s);
        s.earned += amount;
        s.sold += c.count;
        s.served++;
        s.daily.served++;
        s.daily.earned += amount;
        if (c.drive) s.driveCash += amount;
        else s.cash += amount;
        events.push({ ...destination, type: "sale", amount });
        s.tutorial = Math.max(s.tutorial, 4);
        const seat = c.drive
          ? -1
          : s.tables.findIndex(
              (t, i) => i < seats(s) && !t.dirty && t.customer === -1,
            );
        c.seat = seat;
        c.state = seat < 0 ? "leave" : "eat";
        c.timer = 0;
        if (seat >= 0) s.tables[seat].customer = c.id;
      }
    } else if (c.state === "eat") {
      const target = { x: TABLES[c.seat].x, z: TABLES[c.seat].z - 1.35 };
      toward(c, target, 2.3, dt, d, s);
      if (distance(c, target) > 0.2) c.timer = 0;
      if (c.timer > 8) {
        s.tables[c.seat].dirty = true;
        s.tables[c.seat].customer = -1;
        c.state = "leave";
        c.timer = 0;
      }
    } else
      toward(
        c,
        {
          x: c.drive ? -11 : 1.5,
          z: hasExpansion(s, 18) ? 23 : hasExpansion(s, 14) ? 19 : 12,
        },
        3,
        dt,
      );
  }
  s.customers = s.customers.filter(
    (c) =>
      c.state !== "leave" ||
      c.z < (hasExpansion(s, 18) ? 22.8 : hasExpansion(s, 14) ? 18.8 : 11.8),
  );
  if (
    (distance(s.player, REGISTER) < 1.3 || hasExpansion(s, 5)) &&
    s.cash > 0
  ) {
    s.money += s.cash;
    events.push({ ...REGISTER, type: "pickup", amount: s.cash });
    s.cash = 0;
    s.tutorial = Math.max(5, s.tutorial);
  }
  if (
    (distance(s.player, { x: -7, z: 0 }) < 1.3 || hasExpansion(s, 11)) &&
    s.driveCash > 0
  ) {
    s.money += s.driveCash;
    events.push({ x: -7, z: 0, type: "pickup", amount: s.driveCash });
    s.driveCash = 0;
  }
}
