import { hasExpansion } from "./game/types";
import type { GameDefinition, GameState } from "./game/types";
import { settlePayroll, wageRate } from "./game/staff";
import { createGame, refreshDay } from "./game/simulation";
import { decodeSave, encodeSave, offlineRate } from "./save";

export const OPENING_COSTS = [
  0, 2500, 5000, 10000, 18000, 28000, 42000, 60000, 85000,
] as const;
export interface Career {
  active: number;
  branches: GameState[];
}
export const createCareer = (state: GameState): Career => ({
  active: 0,
  branches: [state],
});
export const activeBranch = (career: Career) => career.branches[career.active];
export function passiveRate(c: Career, d: GameDefinition): number {
  return c.branches.reduce(
    (sum, branch, i) => sum + (i === c.active ? 0 : offlineRate(branch, d)),
    0,
  );
}
export function advanceCareer(
  c: Career,
  d: GameDefinition,
  seconds: number,
): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  let earned = 0;
  for (let i = 0; i < c.branches.length; i++) {
    if (i === c.active) continue;
    const branch = c.branches[i];
    const gross = offlineRate(branch, d) * seconds;
    const payment = Math.min(gross, branch.payrollDebt);
    branch.payrollDebt -= payment;
    branch.wagesPaid = Math.min(
      1e12,
      branch.wagesPaid +
        payment +
        (hasExpansion(branch, 11) ? seconds * wageRate(branch) : 0),
    );
    earned += gross - payment;
  }
  const state = activeBranch(c);
  state.money = Math.min(1e12, state.money + earned);
  settlePayroll(state);
  return earned;
}
export function travel(c: Career, d: GameDefinition, index: number): boolean {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= OPENING_COSTS.length ||
    index === c.active
  )
    return false;
  const current = activeBranch(c);
  settlePayroll(current);
  if (index >= c.branches.length) {
    if (
      index !== c.branches.length ||
      c.branches[index - 1].level < d.unlocks.length ||
      current.money < OPENING_COSTS[index]
    )
      return false;
    current.money -= OPENING_COSTS[index];
    const fresh = createGame(d);
    fresh.money = 0;
    c.branches.push(fresh);
  }
  const wallet = current.money;
  current.money = 0;
  c.active = index;
  activeBranch(c).money = wallet;
  return true;
}
export function careerView(c: Career, d: GameDefinition) {
  return {
    active: c.active,
    money: activeBranch(c).money,
    income: passiveRate(c, d),
    branches: OPENING_COSTS.map((cost, index) => ({
      index,
      cost,
      owned: index < c.branches.length,
      level: c.branches[index]?.level ?? 0,
      available:
        index < c.branches.length ||
        (index === c.branches.length &&
          c.branches[index - 1].level === d.unlocks.length),
    })),
  };
}
// One atomic save slot: the active state remains readable by existing tooling.
// Inactive snapshots never own cash. The shared wallet lives only on active state.
export function encodeCareer(c: Career, now: number): string {
  return JSON.stringify({
    ...JSON.parse(encodeSave(activeBranch(c), now)),
    career: {
      version: 1,
      active: c.active,
      branches: c.branches.map((state, i) =>
        i === c.active ? null : { ...state, money: 0 },
      ),
    },
  });
}
export function decodeCareer(
  raw: string,
  d: GameDefinition,
  now: number,
): { ok: true; career: Career; offline: number } | { ok: false } {
  try {
    if (raw.length > 2000000 || !Number.isFinite(now) || now < 0)
      return { ok: false };
    const data = JSON.parse(raw);
    if (!("career" in data)) {
      const legacy = decodeSave(raw, d, now);
      return legacy.ok
        ? {
            ok: true,
            career: createCareer(legacy.state),
            offline: legacy.offline,
          }
        : { ok: false };
    }
    const meta = data.career;
    if (
      !meta ||
      meta.version !== 1 ||
      !Number.isInteger(meta.active) ||
      !Array.isArray(meta.branches) ||
      meta.branches.length < 1 ||
      meta.branches.length > OPENING_COSTS.length ||
      meta.active < 0 ||
      meta.active >= meta.branches.length ||
      meta.branches[meta.active] !== null
    )
      return { ok: false };
    const current = decodeSave(
      JSON.stringify({ state: data.state, savedAt: data.savedAt }),
      d,
      data.savedAt,
    );
    if (!current.ok) return { ok: false };
    const c: Career = { active: meta.active, branches: [] };
    for (let i = 0; i < meta.branches.length; i++) {
      const result =
        i === meta.active
          ? current
          : decodeSave(
              JSON.stringify({
                state: meta.branches[i],
                savedAt: data.savedAt,
              }),
              d,
              data.savedAt,
            );
      if (
        !result.ok ||
        (i !== meta.active && result.state.money !== 0) ||
        (i < meta.branches.length - 1 &&
          result.state.level !== d.unlocks.length)
      )
        return { ok: false };
      c.branches.push(result.state);
    }
    const offline = accrueOffline(
      c,
      d,
      Math.max(0, (now - data.savedAt) / 1000),
    );
    for (const branch of c.branches) refreshDay(branch, now);
    return { ok: true, career: c, offline };
  } catch {
    return { ok: false };
  }
}

export function accrueOffline(
  c: Career,
  d: GameDefinition,
  elapsed: number,
): number {
  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0;
  let total = 0;
  for (const branch of c.branches) {
    const seconds = Math.min(elapsed, 7200 + branch.upgrades.offline * 4320);
    const income = Math.floor(seconds * offlineRate(branch, d));
    const payment = Math.min(income, branch.payrollDebt);
    branch.payrollDebt -= payment;
    branch.wagesPaid = Math.min(
      1e12,
      branch.wagesPaid +
        payment +
        (hasExpansion(branch, 11) ? seconds * wageRate(branch) : 0),
    );
    total += income - payment;
  }
  const state = activeBranch(c);
  const before = state.money;
  state.money = Math.min(1e12, state.money + total);
  settlePayroll(state);
  return Math.max(0, state.money - before);
}
