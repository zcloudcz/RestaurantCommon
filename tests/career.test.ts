import { describe, it, expect } from "vitest";
import { burger } from "../../BurgerRush/src/definition";
import { pizza } from "../../PizzaPiazza/src/definition";
import { createGame } from "../src/game/simulation";
import { encodeSave } from "../src/save";
import {
  createCareer,
  activeBranch,
  travel,
  encodeCareer,
  decodeCareer,
  advanceCareer,
  accrueOffline,
  OPENING_COSTS,
} from "../src/career";
for (const d of [burger, pizza])
  describe(`${d.id} empire`, () => {
    it("gates purchases by mastery, sequence and funds", () => {
      const c = createCareer(createGame(d));
      activeBranch(c).money = 100000;
      expect(travel(c, d, 1)).toBe(false);
      activeBranch(c).level = 18;
      expect(travel(c, d, 2)).toBe(false);
      activeBranch(c).money = 2499;
      expect(travel(c, d, 1)).toBe(false);
      expect(activeBranch(c).money).toBe(2499);
    });
    it("starts from zero, shares one wallet and retains every branch", () => {
      const c = createCareer(createGame(d));
      const first = activeBranch(c);
      first.level = 18;
      first.money = 10000;
      first.upgrades.speed = 3;
      expect(travel(c, d, 1)).toBe(true);
      expect(activeBranch(c).level).toBe(0);
      expect(activeBranch(c).upgrades.speed).toBe(0);
      expect(activeBranch(c).money).toBe(7500);
      expect(first.money).toBe(0);
      activeBranch(c).money -= 100;
      expect(travel(c, d, 0)).toBe(true);
      expect(activeBranch(c)).toBe(first);
      expect(first.money).toBe(7400);
      expect(first.upgrades.speed).toBe(3);
      expect(travel(c, d, 1)).toBe(true);
      expect(activeBranch(c).money).toBe(7400);
    });
    it("migrates single-branch saves, round-trips network and pays offline only once", () => {
      const s = createGame(d);
      s.level = 18;
      s.money = 10000;
      const old = decodeCareer(encodeSave(s, 10000000), d, 10000000);
      expect(old.ok).toBe(true);
      if (!old.ok) return;
      travel(old.career, d, 1);
      const saved = encodeCareer(old.career, 10000000);
      const loaded = decodeCareer(saved, d, 10010000);
      expect(loaded.ok).toBe(true);
      if (!loaded.ok) return;
      expect(loaded.offline).toBeGreaterThan(0);
      expect(loaded.career.active).toBe(1);
      const again = decodeCareer(
        encodeCareer(loaded.career, 10010000),
        d,
        10010000,
      );
      expect(again.ok && again.offline).toBe(0);
      expect(again.ok && activeBranch(again.career).money).toBe(
        activeBranch(loaded.career).money,
      );
    });
    it("pays passive net income without simulating the active branch twice", () => {
      const c = createCareer(createGame(d));
      activeBranch(c).level = 18;
      activeBranch(c).money = 10000;
      expect(advanceCareer(c, d, 60)).toBe(0);
      travel(c, d, 1);
      const before = activeBranch(c).money;
      expect(advanceCareer(c, d, 60)).toBeGreaterThan(0);
      expect(activeBranch(c).money).toBeGreaterThan(before);
      expect(c.branches[0].money).toBe(0);
    });
    it("bounds offline accrual and pays old debt before investing", () => {
      const c = createCareer(createGame(d));
      const first = activeBranch(c);
      first.level = 18;
      first.money = 2500;
      first.payrollDebt = 100;
      expect(travel(c, d, 1)).toBe(false);
      expect(first.money).toBe(2400);
      expect(first.payrollDebt).toBe(0);
      first.money = 10000;
      travel(c, d, 1);
      first.payrollDebt = 100;
      const before = activeBranch(c).money;
      advanceCareer(c, d, 1);
      expect(activeBranch(c).money).toBe(before);
      expect(first.payrollDebt).toBeLessThan(100);
      const a = structuredClone(c),
        b = structuredClone(c);
      expect(accrueOffline(a, d, 7200)).toBe(accrueOffline(b, d, 900000));
    });
    it("builds all nine branches and never recharges visits", () => {
      const c = createCareer(createGame(d));
      activeBranch(c).money = 1000000;
      for (let i = 1; i < 9; i++) {
        activeBranch(c).level = 18;
        expect(travel(c, d, i)).toBe(true);
      }
      expect(c.branches).toHaveLength(9);
      const balance = activeBranch(c).money;
      expect(travel(c, d, 0)).toBe(true);
      expect(travel(c, d, 8)).toBe(true);
      expect(activeBranch(c).money).toBe(balance);
      expect(decodeCareer(encodeCareer(c, 100), d, 100).ok).toBe(true);
    });
    it("rejects corrupt careers and prevents wallet duplication", () => {
      const c = createCareer(createGame(d));
      activeBranch(c).level = 18;
      activeBranch(c).money = 10000;
      travel(c, d, 1);
      for (const mutate of [
        (v: any) => (v.career.version = 2),
        (v: any) => (v.career.active = 8),
        (v: any) => (v.career.branches[0].money = 100),
        (v: any) => (v.career.branches[0].level = 1),
      ]) {
        const data = JSON.parse(encodeCareer(c, 100));
        mutate(data);
        expect(decodeCareer(JSON.stringify(data), d, 100).ok).toBe(false);
      }
      expect(travel(c, d, NaN)).toBe(false);
      expect(travel(c, d, OPENING_COSTS.length)).toBe(false);
    });
  });
