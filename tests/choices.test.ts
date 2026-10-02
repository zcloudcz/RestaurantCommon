import { describe, it, expect } from "vitest";
import { burger } from "../../BurgerRush/src/definition";
import { pizza } from "../../PizzaPiazza/src/definition";
import { createGame, command, step } from "../src/game/simulation";
import { expansionChoices, hasExpansion, tableCount } from "../src/game/types";
import { encodeSave, decodeSave } from "../src/save";
import { offeredIds } from "../src/progression";
import { walkable } from "../src/game/navigation";
for (const d of [burger, pizza])
  describe(`${d.id} real expansion choices`, () => {
    it("offers two independent purchases and grants only the chosen effect", () => {
      const s = createGame(d);
      s.money = 1000;
      expect(expansionChoices(s)).toEqual([1, 3]);
      expect(command(s, d, { type: "unlock", index: 3 })).toBe(true);
      expect(s.level).toBe(1);
      expect(s.owned).toEqual([3]);
      expect(hasExpansion(s, 1)).toBe(false);
      expect(tableCount(s)).toBe(0);
      expect(walkable({ x: 4, z: 3.3 }, d, 0, s)).toBe(true);
      expect(decodeSave(encodeSave(s, 1000), d, 1000).ok).toBe(true);
      expect(command(s, d, { type: "unlock", index: 2 })).toBe(false);
    });
    it("keeps contributions separate when choosing the other offer", () => {
      const s = createGame(d);
      s.money = 5;
      command(s, d, { type: "unlock", index: 1 });
      s.money = 7;
      command(s, d, { type: "unlock", index: 3 });
      expect(s.funding).toEqual({ 1: 5, 3: 7 });
      expect(s.paid).toBe(7);
      expect(decodeSave(encodeSave(s, 1000), d, 1000).ok).toBe(true);
    });
    it("preserves old partial funding and rejects duplicate ownership", () => {
      const s = createGame(d);
      s.level = 2;
      s.paid = 4;
      s.money = 6;
      expect(command(s, d, { type: "unlock", index: 4 })).toBe(true);
      expect(s.funding).toEqual({ 3: 4, 4: 6 });
      expect(s.owned).toEqual([1, 2]);
      s.owned = [1, 1];
      expect(decodeSave(encodeSave(s, 1000), d, 1000).ok).toBe(false);
    });
    it("does not choose an expansion merely by standing on its plot", () => {
      const s = createGame(d);
      s.money = 1000;
      s.player.x = 6;
      s.player.z = -1.8;
      step(s, d, { x: 0, z: 0 }, 0.1);
      expect(s.level).toBe(0);
      expect(s.paid).toBe(0);
    });
  });
it("shared choice policy respects prerequisites and the finite final option", () => {
  expect(offeredIds(4, [], { 2: [1] })).toEqual([1, 3]);
  expect(offeredIds(4, [1, 2, 3])).toEqual([4]);
});

for (const d of [burger, pizza])
  it(`${d.id} reversed-choice completion preserves live saves`, () => {
    const s = createGame(d);
    s.money = 100000;
    while (s.level < d.unlocks.length) {
      const choices = expansionChoices(s);
      command(s, d, { type: "unlock", index: choices.at(-1) });
      for (let i = 0; i < 100; i++) step(s, d, { x: 0, z: 0 }, 0.1);
      expect(
        decodeSave(encodeSave(s, 1000), d, 1000).ok,
        `owned ${s.owned}`,
      ).toBe(true);
    }
    expect(new Set(s.owned).size).toBe(18);
  });
