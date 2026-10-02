import { distanceToFootprint } from "../interaction";
import { hasExpansion } from "./types";
import {
  TRASH,
  TABLES,
  tableCount,
  type Carrier,
  type GameState,
  type GameDefinition,
  type GameEvent,
} from "./types";
import { distance } from "./navigation";
export const capacity = (s: GameState) =>
  5 + s.upgrades.capacity * 3 + (hasExpansion(s, 13) ? 5 : 0);
export const seats = (s: GameState) => tableCount(s);
export function produce(s: GameState, d: GameDefinition, dt: number): void {
  d.stations.forEach((def, i) => {
    const st = s.stations[i];
    if (!hasExpansion(s, def.unlock) || def.kind === "counter") return;
    if (st.output >= 12 || (def.input && st.input === 0)) {
      st.timer = 0;
      return;
    }
    const multiplier =
      (1 + s.upgrades.production * 0.2) *
      (def.id === "source" && hasExpansion(s, 3) ? 2 : 1) *
      (def.kind !== "source" && hasExpansion(s, 10) ? 2 : 1) *
      (hasExpansion(s, 16) ? 1.5 : 1);
    st.timer += dt * multiplier;
    if (st.timer >= def.seconds) {
      st.timer = 0;
      const count = Math.min(
        def.batch,
        12 - st.output,
        def.input ? st.input : 12,
      );
      if (def.input) st.input -= count;
      st.output += count;
    }
  });
}
export function interact(
  s: GameState,
  d: GameDefinition,
  c: Carrier,
  events: GameEvent[],
  dt: number,
  only?: string,
): void {
  c.cooldown -= dt;
  if (c.cooldown > 0) return;
  c.cooldown = 0.12;
  if (distance(c, TRASH) < 1) {
    if (c.count) {
      events.push({
        ...c,
        type: "drop",
        amount: c.count,
        item: c.item ?? "trash",
      });
      c.count = 0;
      c.fries = 0;
      c.item = null;
    }
    return;
  }
  for (let i = 0; i < seats(s); i++)
    if (
      s.tables[i].dirty &&
      distance(c, { x: TABLES[i].x, z: TABLES[i].z - 1.35 }) < 1 &&
      (!c.item || c.item === "trash") &&
      c.count < capacity(s)
    ) {
      s.tables[i].dirty = false;
      c.item = "trash";
      c.count++;
      s.cleaned++;
      s.daily.cleaned++;
      events.push({ x: c.x, z: c.z, type: "clean", amount: 1 });
      return;
    }
  for (let i = 0; i < d.stations.length; i++) {
    const def = d.stations[i],
      st = s.stations[i];
    // Measure player reach from the whole counter footprint, not one spot
    // in front. Keep the staff's deliberate transfer points unchanged.
    const inReach =
      c === s.player
        ? distanceToFootprint(c, def, 1.5, 0.96) <= 1.1
        : distance(c, { x: def.x, z: def.z + 1.5 }) <= 1.05;
    if (!hasExpansion(s, def.unlock) || (only && only !== def.id) || !inReach)
      continue;
    const side =
      d.id === "burger" &&
      def.kind === "counter" &&
      c.fries > 0 &&
      st.fries < 24;
    if (c.count && (c.item === def.input || side)) {
      const target = side
        ? "fries"
        : def.kind === "counter"
          ? "output"
          : "input";
      if (st[target] >= 24) return;
      st[target]++;
      c.count--;
      if (side) c.fries--;
      const item = side ? "fries" : c.item;
      if (!c.count) c.item = null;
      else if (c.count === c.fries) c.item = "fries";
      events.push({ ...def, type: "drop", amount: 1, item: item ?? undefined });
      if (c === s.player) {
        if (def.id === "counter") s.tutorial = Math.max(3, s.tutorial);
        else s.tutorial = Math.max(2, s.tutorial);
      }
    } else if (
      def.kind !== "counter" &&
      st.output > 0 &&
      (!c.item ||
        c.item === def.output ||
        (d.id === "burger" &&
          ((c.item === "meal" && def.output === "fries") ||
            (c.item === "fries" && def.output === "meal")))) &&
      c.count < capacity(s)
    ) {
      st.output--;
      if (def.output === "fries") c.fries++;
      c.item =
        c.item === "meal" && def.output === "fries" ? "meal" : def.output;
      c.count++;
      events.push({ ...c, type: "pickup", amount: 1, item: def.output });
      if (c === s.player) s.tutorial = Math.max(1, s.tutorial);
    }
    return;
  }
}
