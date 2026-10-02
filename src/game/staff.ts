import { hasExpansion } from "./types";
import {
  REGISTER,
  TRASH,
  TABLES,
  type GameState,
  type GameDefinition,
  type GameEvent,
  type Worker,
  type Vec,
} from "./types";
import { toward, distance } from "./navigation";
import { interact, capacity, seats } from "./production";
export function staffPlan(
  level: import("./types").Progress,
): { id: string; role: Worker["role"] }[] {
  const roles: Worker["role"][] = [];
  if (hasExpansion(level, 5)) roles.push("cashier");
  if (hasExpansion(level, 7)) roles.push("cook");
  if (hasExpansion(level, 8)) roles.push("cleaner");
  if (hasExpansion(level, 11)) roles.push("server");
  if (hasExpansion(level, 13)) roles.push("server");
  if (hasExpansion(level, 14)) roles.push("cleaner");
  if (hasExpansion(level, 15)) roles.push("cook");
  if (hasExpansion(level, 16)) roles.push("server");
  if (hasExpansion(level, 17)) roles.push("cleaner");
  if (hasExpansion(level, 18)) roles.push("cook");
  const counts = { cashier: 0, cook: 0, cleaner: 0, server: 0 };
  return roles.map((role) => ({ role, id: `${role}-${++counts[role]}` }));
}
const salary = { cashier: 2, cook: 3, server: 2.5, cleaner: 1.5 };
export const payrollPerMinute = (s: GameState) =>
  staffPlan(s).reduce((total, w) => total + salary[w.role], 0);
export const wageRate = (s: GameState) => payrollPerMinute(s) / 60;
/** Outstanding wages are always paid before the owner's next purchase. */
export function settlePayroll(s: GameState): void {
  const payment = Math.min(s.money, s.payrollDebt);
  s.money -= payment;
  s.payrollDebt -= payment;
  s.wagesPaid = Math.min(1e12, s.wagesPaid + payment);
}
export function staff(
  s: GameState,
  d: GameDefinition,
  dt: number,
  events: GameEvent[],
): void {
  const plan = staffPlan(s);
  const assigned = new Set(s.workers.flatMap((w) => (w.id ? [w.id] : [])));
  for (const worker of s.workers) {
    if (worker.id) continue;
    const slot = plan.find(
      (p) => p.role === worker.role && !assigned.has(p.id),
    );
    if (slot) {
      worker.id = slot.id;
      assigned.add(slot.id);
    }
  }
  for (const slot of plan)
    if (!s.workers.some((w) => w.id === slot.id))
      s.workers.push({
        ...slot,
        x: 1.8,
        z: -2,
        item: null,
        count: 0,
        fries: 0,
        angle: 0,
        cooldown: 0,
        target: "",
      });
  // Staff continue on credit if the till is empty. Debt is persisted and repaid
  // from subsequent takings, so insolvency never disables the production chain.
  if (Number.isFinite(dt) && dt > 0) {
    s.payrollDebt = Math.min(1e12, s.payrollDebt + wageRate(s) * dt);
    settlePayroll(s);
  }
  for (const w of s.workers) {
    let target: Vec = { x: 2, z: -1 },
      id = "";
    if (w.role === "cashier") target = REGISTER;
    if (w.role === "cook") {
      const processors = d.stations.filter(
        (st) =>
          hasExpansion(s, st.unlock) &&
          st.input === w.item &&
          st.kind !== "counter",
      );
      const leastStocked = processors.sort((a, b) => {
        const stock = (id: string) => {
          const st = s.stations.find((v) => v.id === id)!;
          return st.input + st.output;
        };
        return (
          stock(a.id) - stock(b.id) ||
          Number(b.id === "annex") - Number(a.id === "annex")
        );
      })[0];
      if (w.item === "raw" || w.item === "prep")
        id = leastStocked?.id ?? "prep";
      else if (w.item === "meal") id = "counter";
      else if (
        d.id === "pizza" &&
        (s.stations.find((x) => x.id === "prep")?.output ?? 0) > 0
      )
        id = "prep";
      else id = "source";
    }
    if (w.role === "server") {
      if (w.item === "meal" || w.item === "fries") {
        const stock = w.item === "fries" ? "fries" : "output";
        id = d.stations
          .filter((st) => st.kind === "counter" && hasExpansion(s, st.unlock))
          .sort(
            (a, b) =>
              s.stations.find((v) => v.id === a.id)![stock] -
              s.stations.find((v) => v.id === b.id)![stock],
          )[0].id;
      } else {
        const counter = s.stations.find((x) => x.id === "counter")!;
        const fryer = s.stations.find((x) => x.id === "fryer");
        const drive = s.stations.find((x) => x.id === "drive")!;
        id =
          d.id === "burger" &&
          fryer &&
          fryer.output > 0 &&
          ((counter.output >= 2 && counter.fries < 2) ||
            (drive.output >= 2 && drive.fries < 2))
            ? "fryer"
            : d.stations
                .filter(
                  (st) =>
                    st.output === "meal" &&
                    st.kind !== "counter" &&
                    hasExpansion(s, st.unlock),
                )
                .sort(
                  (a, b) =>
                    s.stations.find((v) => v.id === b.id)!.output -
                    s.stations.find((v) => v.id === a.id)!.output,
                )[0].id;
      }
    }
    const delivering = d.stations.find(
      (st) => st.id === w.target && hasExpansion(s, st.unlock),
    );
    const deliveryStock = s.stations.find((st) => st.id === delivering?.id);
    const deliveryBuffer =
      w.item === "fries"
        ? "fries"
        : delivering?.kind === "counter"
          ? "output"
          : "input";
    if (
      w.count > 0 &&
      delivering &&
      deliveryStock &&
      deliveryStock[deliveryBuffer] < 24 &&
      (delivering.input === w.item ||
        (delivering.kind === "counter" && w.item === "fries"))
    )
      id = delivering.id;
    // Finish collecting a batch before changing destinations. Otherwise a worker
    // spends most of the shift carrying single items across the restaurant.
    if (w.role === "cook" || w.role === "server") {
      const old = d.stations.find((st) => st.id === w.target),
        stock = s.stations.find((st) => st.id === w.target);
      if (
        old &&
        stock &&
        old.kind !== "counter" &&
        distance(w, { x: old.x, z: old.z + 1.5 }) < 0.4 &&
        w.item === old.output &&
        w.count < capacity(s) &&
        (stock.output > 0 || stock.input > 0)
      )
        id = old.id;
      if (
        w.role === "cook" &&
        !w.item &&
        d.id === "pizza" &&
        w.target === "prep" &&
        (s.stations.find((st) => st.id === "prep")?.input ?? 0) > 0
      )
        id = "prep";
    }
    if (id) {
      const st = d.stations.find((x) => x.id === id)!;
      target = { x: st.x, z: st.z + 1.5 };
    }
    if (w.role === "cleaner") {
      const dirty = s.tables.findIndex((t, i) => t.dirty && i < seats(s));
      target =
        w.count >= capacity(s) || (dirty < 0 && w.count > 0)
          ? TRASH
          : dirty >= 0
            ? { x: TABLES[dirty].x, z: TABLES[dirty].z - 1.35 }
            : { x: 2, z: 6 };
    }
    w.target = id;
    const prev = { x: w.x, z: w.z };
    toward(
      w,
      target,
      3.1 * (1 + s.upgrades.staff * 0.15) * (hasExpansion(s, 14) ? 1.35 : 1),
      dt,
      d,
      s,
    );
    if (distance(prev, w) > 0.001)
      w.angle = Math.atan2(w.x - prev.x, w.z - prev.z);
    // Buffers are checked for every transfer, preventing double consumption.
    if (distance(w, target) < 0.3)
      interact(s, d, w, events, dt, id || undefined);
  }
}
