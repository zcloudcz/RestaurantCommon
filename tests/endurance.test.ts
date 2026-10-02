import { it, expect, describe } from "vitest";
import { createGame, step } from "../src/game/simulation";
import { burger } from "../../BurgerRush/src/definition";
import { pizza } from "../../PizzaPiazza/src/definition";
import { route, walkable, distance } from "../src/game/navigation";
import { decodeSave, encodeSave } from "../src/save";
describe.each([burger, pizza])("$id sustained play", (d) => {
  it("bounds the total population when the register is unattended", () => {
    const s = createGame(d);
    const counter = s.stations.find((st) => st.id === "counter")!;
    for (let i = 0; i < 40000; i++) {
      if (i % 100 === 0) counter.output = Math.min(24, counter.output + 1);
      step(s, d, { x: 0, z: 0 }, 0.1);
    }
    expect(s.customers.length).toBeLessThanOrEqual(40);
    expect(s.customers.some((c) => c.state === "pay")).toBe(true);
    expect(s.spawn).toBeGreaterThanOrEqual(0);
    expect(decodeSave(encodeSave(s, Date.now()), d, Date.now()).ok).toBe(true);
  });
  it("all station interaction points have a walkable route", () => {
    for (const st of d.stations) {
      const end = { x: st.x, z: st.z + 1.5 },
        path = route({ x: -2, z: -1 }, end, d, Math.max(12, st.unlock));
      expect(path.length).toBeGreaterThan(1);
      expect(
        path.every((p) => walkable(p, d, 0, Math.max(12, st.unlock))),
      ).toBe(true);
      expect(distance(path.at(-1)!, end)).toBeLessThan(0.1);
    }
  });
  it("fully staffed restaurant continues selling for an hour", () => {
    const s = createGame(d);
    s.level = 11;
    s.player.x = 2;
    s.player.z = 0;
    for (let i = 0; i < 18000; i++) step(s, d, { x: 0, z: 0 }, 0.1);
    const halfway = s.served;
    for (let i = 0; i < 18000; i++) step(s, d, { x: 0, z: 0 }, 0.1);
    expect(halfway).toBeGreaterThan(30);
    expect(s.served - halfway).toBeGreaterThan(30);
    expect(s.customers.length).toBeLessThan(40);
    expect(
      s.stations.every(
        (st) =>
          st.input >= 0 && st.output >= 0 && st.input <= 24 && st.output <= 24,
      ),
    ).toBe(true);
    console.log(d.id, { served: s.served, earned: s.earned });
  }, 30000);
});
