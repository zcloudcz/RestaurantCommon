import { describe, it, expect } from "vitest";
import { burger } from "../../BurgerRush/src/definition";
import { pizza } from "../../PizzaPiazza/src/definition";
import { createGame, step, command } from "../src/game/simulation";
import {
  staff,
  staffPlan,
  wageRate,
  payrollPerMinute,
  settlePayroll,
} from "../src/game/staff";
import { encodeSave, decodeSave, offlineRate } from "../src/save";

describe.each([burger, pizza])("$id staff and payroll", (d) => {
  it("grows the actual roster with each new wing and retains stable identities", () => {
    const s = createGame(d);
    s.level = 12;
    staff(s, d, 0, []);
    const original = s.workers.map((w) => w.id);
    expect(s.workers).toHaveLength(4);
    for (let level = 13; level <= 18; level++) {
      s.level = level;
      staff(s, d, 0, []);
      expect(s.workers).toHaveLength(level - 8);
      expect(s.workers.slice(0, 4).map((w) => w.id)).toEqual(original);
      expect(new Set(s.workers.map((w) => w.id)).size).toBe(s.workers.length);
    }
    expect(s.workers.filter((w) => w.role === "cook")).toHaveLength(3);
    expect(s.workers.filter((w) => w.role === "server")).toHaveLength(3);
    expect(s.workers.filter((w) => w.role === "cleaner")).toHaveLength(3);
    expect(decodeSave(encodeSave(s, 100), d, 100).ok).toBe(true);
  });
  it("charges elapsed working time, never frame counts, and persists accounting", () => {
    const s = createGame(d);
    s.level = 18;
    s.money = 100;
    for (let i = 0; i < 600; i++) staff(s, d, 0.1, []);
    expect(s.wagesPaid).toBeCloseTo(payrollPerMinute(s));
    expect(s.money).toBeCloseTo(100 - payrollPerMinute(s));
    expect(s.payrollDebt).toBe(0);
    const paid = s.wagesPaid;
    staff(s, d, 0, []);
    expect(s.wagesPaid).toBe(paid);
    const loaded = decodeSave(encodeSave(s, 100), d, 100);
    expect(loaded.ok).toBe(true);
    if (loaded.ok) expect(loaded.state.wagesPaid).toBeCloseTo(paid);
  });
  it("records arrears without a negative wallet, keeps working and recovers from sales", () => {
    const s = createGame(d);
    s.level = 11;
    staff(s, d, 60, []);
    expect(s.money).toBe(0);
    expect(s.payrollDebt).toBeCloseTo(payrollPerMinute(s));
    expect(s.wagesPaid).toBe(0);
    for (let i = 0; i < 6000; i++) step(s, d, { x: 0, z: 0 }, 0.1);
    expect(s.served).toBeGreaterThan(20);
    expect(s.money).toBeGreaterThan(0);
    expect(s.payrollDebt).toBe(0);
    expect(s.wagesPaid).toBeCloseTo(payrollPerMinute(s) * 11);
  });
  it("pays old debt before upgrades and records every deducted dollar", () => {
    const s = createGame(d);
    s.money = 50;
    s.payrollDebt = 10;
    expect(command(s, d, { type: "upgrade", id: "speed" })).toBe(false);
    expect(s.money).toBe(40);
    expect(s.payrollDebt).toBe(0);
    expect(s.wagesPaid).toBe(10);
    s.money = 2;
    s.payrollDebt = 3;
    settlePayroll(s);
    expect(s.money).toBe(0);
    expect(s.payrollDebt).toBe(1);
  });
  it("migrates old payroll and worker IDs while rejecting duplicate or excessive hires", () => {
    const s = createGame(d);
    s.level = 12;
    s.money = 123;
    staff(s, d, 0, []);
    const old = JSON.parse(encodeSave(s, 100));
    delete old.state.payrollDebt;
    delete old.state.wagesPaid;
    old.state.workers.forEach((w: { id?: string }) => delete w.id);
    const loaded = decodeSave(JSON.stringify(old), d, 100);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.money).toBe(123);
    expect(loaded.state.payrollDebt).toBe(0);
    expect(loaded.state.wagesPaid).toBe(0);
    expect(loaded.state.workers.map((w) => w.id)).toEqual(
      staffPlan(12).map((w) => w.id),
    );
    loaded.state.workers.push({ ...loaded.state.workers[0] });
    expect(decodeSave(encodeSave(loaded.state, 100), d, 100).ok).toBe(false);
    old.state.workers.push({ ...old.state.workers[0] });
    expect(decodeSave(JSON.stringify(old), d, 100).ok).toBe(false);
  });
  it("offline proceeds are net wages and repay accumulated arrears", () => {
    const s = createGame(d);
    s.level = 18;
    s.payrollDebt = 20;
    const duration = 3600;
    const loaded = decodeSave(encodeSave(s, 100), d, 100 + duration * 1000);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.money).toBeCloseTo(
      Math.floor(duration * offlineRate(s, d)) - 20,
    );
    expect(loaded.offline).toBeCloseTo(loaded.state.money);
    expect(loaded.state.payrollDebt).toBe(0);
    expect(loaded.state.wagesPaid).toBeCloseTo(duration * wageRate(s) + 20);
    const base = createGame(d);
    base.level = 12;
    expect(offlineRate(s, d)).toBeGreaterThan(offlineRate(base, d));
  });
});
