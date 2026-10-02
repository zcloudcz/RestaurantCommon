import {
  ownedIds,
  expansionDependencies,
  expansionChoices,
  expansionPaid,
} from "./game/types";
import { hasExpansion } from "./game/types";
import type { GameState, GameDefinition } from "./game/types";
import { z } from "zod";
import { staffPlan, wageRate, settlePayroll } from "./game/staff";
import { price } from "./game/customers";
import { refreshDay } from "./game/simulation";
import { createGame } from "./game/simulation";
import { walkable } from "./game/navigation";
import { capacity, seats } from "./game/production";
import { HOME, TABLES } from "./game/types";
const n = z.number().finite().min(0).max(1e12),
  integer = n.int();
const position = {
  x: z.number().finite().min(-30).max(30),
  z: z.number().finite().min(-30).max(30),
};
const carrier = z
  .object({
    ...position,
    item: z.enum(["raw", "prep", "meal", "fries", "trash"]).nullable(),
    count: integer.max(25),
    fries: integer.max(25).optional(),
    angle: z.number().finite(),
    cooldown: z.number().finite().min(-1).max(1),
  })
  .transform((v) => ({
    ...v,
    fries: v.fries ?? (v.item === "fries" ? v.count : 0),
  }))
  .refine(
    (v) =>
      (v.count === 0) === (v.item === null) &&
      v.fries <= v.count &&
      (v.item === "fries"
        ? v.fries === v.count
        : v.item === "meal"
          ? v.fries < v.count
          : v.fries === 0),
  );
const level = integer.max(5);
const schema = z.object({
  state: z.object({
    version: z.literal(1),
    id: z.enum(["pizza", "burger"]),
    time: n,
    money: n,
    earned: n,
    sold: integer,
    served: integer,
    cleaned: integer,
    level: integer.max(18),
    paid: n,
    owned: z.array(integer.min(1).max(18)).max(18).optional(),
    selected: integer.min(1).max(18).optional(),
    funding: z.record(z.string(), n).optional(),
    recipe: integer.max(3),
    skin: integer.max(2),
    tutorial: integer.max(5),
    seed: integer.max(4294967295),
    nextId: integer,
    spawn: z.number().finite().min(-1000).max(60),
    cash: n,
    driveCash: n,
    payrollDebt: n.default(0),
    wagesPaid: n.default(0),
    player: carrier,
    stations: z
      .array(
        z.object({
          id: z.string().max(20),
          input: integer.max(24),
          output: integer.max(24),
          timer: n.max(20),
          fries: integer.max(24).default(0),
        }),
      )
      .min(4)
      .max(7),
    customers: z
      .array(
        z.object({
          ...position,
          id: integer,
          state: z.enum(["queue", "pay", "eat", "leave"]),
          count: integer.min(1).max(4),
          timer: n.max(1e7),
          seat: z
            .number()
            .int()
            .min(-1)
            .max(TABLES.length - 1),
          drive: z.boolean(),
          color: integer.max(5),
          fries: integer.max(4).default(0),
        }),
      )
      .max(60),
    workers: z
      .array(
        carrier.and(
          z.object({
            id: z.string().max(24).optional(),
            role: z.enum(["cook", "server", "cashier", "cleaner"]),
            target: z.string().max(20),
          }),
        ),
      )
      .max(10),
    tables: z
      .array(
        z.object({
          dirty: z.boolean(),
          timer: n,
          customer: z.number().int().min(-1).max(1e12),
        }),
      )
      .min(4)
      .max(TABLES.length),
    upgrades: z.object({
      speed: level,
      capacity: level,
      income: level,
      production: level,
      staff: level,
      offline: level,
    }),
    daily: z.object({
      day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      served: integer,
      earned: n,
      cleaned: integer,
      claimed: z.array(z.boolean()).length(3),
    }),
  }),
  savedAt: z.number().finite().min(0).max(8640000000000000),
});
export function encodeSave(s: GameState, now: number): string {
  return JSON.stringify({ state: s, savedAt: now });
}
export function offlineRate(s: GameState, d: GameDefinition): number {
  // Passive revenue requires the entire transport chain, not just a cashier.
  if (!hasExpansion(s, 11) || !hasExpansion(s, 5)) return 0;
  const source = d.stations[0];
  const production =
    ((hasExpansion(s, 3) ? 2 : 1) * (1 + s.upgrades.production * 0.2)) /
    source.seconds;
  const plan = staffPlan(s);
  const teams = Math.min(
    plan.filter((w) => w.role === "cook").length,
    plan.filter((w) => w.role === "server").length,
  );
  const transport =
    0.28 *
    teams *
    (1 + s.upgrades.staff * 0.15) *
    (hasExpansion(s, 14) ? 1.35 : 1);
  return Math.max(
    0,
    Math.min(production * (hasExpansion(s, 16) ? 1.5 : 1), transport) *
      price(s, d) *
      0.65 *
      (hasExpansion(s, 18) ? 1.5 : 1) -
      wageRate(s),
  );
}
export function decodeSave(
  raw: string,
  d: GameDefinition,
  now: number,
): { ok: true; state: GameState; offline: number } | { ok: false } {
  try {
    if (raw.length > 500000 || !Number.isFinite(now) || now < 0)
      return { ok: false };
    const data: unknown = JSON.parse(raw);
    let result = schema.safeParse(data);
    if (!result.success) {
      // Version 0 predates cosmetics and daily goals; all other fields still pass
      // the current validators before the upgraded save can enter the simulation.
      const legacy = schema
        .extend({
          state: schema.shape.state.extend({
            version: z.literal(0),
            skin: integer.max(2).optional(),
            daily: schema.shape.state.shape.daily.optional(),
          }),
        })
        .safeParse(data);
      if (!legacy.success) return { ok: false };
      result = schema.safeParse({
        ...legacy.data,
        state: {
          ...legacy.data.state,
          version: 1,
          skin: legacy.data.state.skin ?? 0,
          daily: legacy.data.state.daily ?? createGame(d).daily,
        },
      });
    }
    if (!result.success) return { ok: false };
    const s: GameState = result.data.state;
    // Exact legacy layout only; do not repair arbitrary missing/unknown stations.
    if (
      d.id === "burger" &&
      s.id === "burger" &&
      s.stations.map((st) => st.id).join(",") === "source,prep,counter,drive"
    ) {
      s.stations.push({ id: "fryer", input: 0, output: 5, timer: 0, fries: 0 });
      const before = {
        ...d,
        stations: d.stations.filter((st) => st.id !== "fryer"),
      };
      for (const carrier of [s.player, ...s.workers]) {
        if (walkable(carrier, before, 0, s) && !walkable(carrier, d, 0, s))
          Object.assign(carrier, HOME);
      }
    }
    const legacyIds =
      d.id === "burger"
        ? "source,prep,counter,drive,fryer"
        : "source,prep,oven,counter,drive";
    if (
      s.id === d.id &&
      s.stations.map((st) => st.id).join(",") === legacyIds &&
      s.tables.length === 4
    ) {
      for (const def of d.stations.slice(5))
        s.stations.push({
          id: def.id,
          input: 0,
          output: 0,
          timer: 0,
          fries: 0,
        });
      while (s.tables.length < TABLES.length)
        s.tables.push({ dirty: false, timer: 0, customer: -1 });
      // Old seated guests stood inside the table collision radius.
      for (const guest of s.customers)
        if (
          guest.state === "eat" &&
          guest.seat >= 0 &&
          guest.seat < seats(s) &&
          !walkable(guest, d, 0, s)
        ) {
          guest.x = TABLES[guest.seat].x;
          guest.z = TABLES[guest.seat].z - 1.35;
        }
    }
    if (s.tables.length !== TABLES.length) return { ok: false };
    if (
      (d.id === "pizza" && [s.player, ...s.workers].some((c) => c.fries > 0)) ||
      s.customers.some((c) => c.fries > c.count) ||
      (d.id === "pizza" &&
        (s.customers.some((c) => c.fries > 0) ||
          s.stations.some((st) => st.fries > 0)))
    )
      return { ok: false };
    const allowedItems = new Set([
      "trash",
      ...d.stations.map((st) => st.output),
    ]);
    if (
      [s.player, ...s.workers].some(
        (c) =>
          !walkable(c, d, 0, s) ||
          c.count > capacity(s) ||
          (c.item !== null && !allowedItems.has(c.item)),
      )
    )
      return { ok: false };
    if (
      s.id !== d.id ||
      s.level > d.unlocks.length ||
      s.recipe >= d.recipes.length ||
      s.stations.length !== d.stations.length ||
      s.stations.some((v, i) => v.id !== d.stations[i].id) ||
      !hasExpansion(s, d.recipeLevels[s.recipe])
    )
      return { ok: false };
    if (
      s.owned === undefined &&
      (s.selected !== undefined || s.funding !== undefined)
    )
      return { ok: false };
    const owned = ownedIds(s);
    if (
      s.owned &&
      (new Set(owned).size !== owned.length ||
        owned.length !== s.level ||
        owned.some(
          (id) =>
            id > d.unlocks.length ||
            (expansionDependencies[id] ?? []).some(
              (dep) => !owned.includes(dep),
            ),
        ))
    )
      return { ok: false };
    const choices = expansionChoices(s, d.unlocks.length);
    if (s.selected !== undefined && !choices.includes(s.selected))
      return { ok: false };
    if (
      s.funding &&
      Object.entries(s.funding).some(
        ([key, value]) =>
          !choices.includes(Number(key)) ||
          String(Number(key)) !== key ||
          value >= d.unlocks[Number(key) - 1].cost,
      )
    )
      return { ok: false };
    if (s.owned) {
      if (s.paid !== (s.selected ? (s.funding?.[s.selected] ?? 0) : 0))
        return { ok: false };
    } else if (
      s.level < d.unlocks.length
        ? s.paid >= d.unlocks[s.level].cost
        : s.paid !== 0
    )
      return { ok: false };
    if (
      s.customers.some(
        (c) => c.state === "eat" && (c.seat < 0 || c.seat >= seats(s)),
      ) ||
      !validRoster(s)
    )
      return { ok: false };
    const seconds = Math.max(
      0,
      Math.min(
        (now - result.data.savedAt) / 1000,
        7200 + s.upgrades.offline * 4320,
      ),
    );
    const before = s.money;
    const profit = Math.floor(seconds * offlineRate(s, d));
    s.money = Math.min(1e12, s.money + profit);
    if (hasExpansion(s, 11))
      s.wagesPaid = Math.min(1e12, s.wagesPaid + seconds * wageRate(s));
    settlePayroll(s);
    const offline = Math.max(0, s.money - before);
    refreshDay(s, now);
    return { ok: true, state: s, offline };
  } catch {
    return { ok: false };
  }
}

function validRoster(s: GameState): boolean {
  const plan = staffPlan(s);
  const seen = new Set<string>();
  for (const worker of s.workers) {
    const slot = worker.id
      ? plan.find((p) => p.id === worker.id && p.role === worker.role)
      : plan.find((p) => p.role === worker.role && !seen.has(p.id));
    if (!slot || seen.has(slot.id)) return false;
    worker.id = slot.id;
    seen.add(slot.id);
  }
  return true;
}
