import { expect, it } from "vitest";
import { burger } from "../../BurgerRush/src/definition";
import { createGame } from "../src/game/simulation";
import { interact } from "../src/game/production";
import { encodeSave, decodeSave } from "../src/save";

for (const first of ["prep", "fryer"]) {
  it(`carries burgers and fries together, picking up ${first} first`, () => {
    const s = createGame(burger);
    s.level = 3;
    const take = (id: string, n: number) => {
      const def = burger.stations.find((st) => st.id === id)!;
      Object.assign(s.player, { x: def.x, z: def.z + 1.5 });
      s.stations.find((st) => st.id === id)!.output = 10;
      for (let i = 0; i < n; i++) interact(s, burger, s.player, [], 0.2);
    };
    take(first, 2);
    take(first === "prep" ? "fryer" : "prep", 4);
    expect(s.player.count).toBe(5);
    expect(s.player.item).toBe("meal");
    expect(s.player.fries).toBe(first === "fryer" ? 2 : 3);
    const loaded = decodeSave(encodeSave(s, 100), burger, 100);
    expect(loaded.ok && loaded.state.player).toEqual(s.player);
    const fries = s.player.fries;
    Object.assign(s.player, { x: -5, z: 3.5 });
    for (let i = 0; i < 5; i++) interact(s, burger, s.player, [], 0.2);
    const counter = s.stations.find((st) => st.id === "counter")!;
    expect(counter.output).toBe(5 - fries);
    expect(counter.fries).toBe(fries);
    expect(s.player.count).toBe(0);
    expect(s.player.fries).toBe(0);
    expect(s.player.item).toBe(null);
  });
}
it("unloads the side even when the burger counter is full", () => {
  const s = createGame(burger);
  s.level = 3;
  Object.assign(s.player, { x: -5, z: 3.5, item: "meal", count: 5, fries: 2 });
  const counter = s.stations.find((st) => st.id === "counter")!;
  counter.output = 24;
  interact(s, burger, s.player, [], 0.2);
  expect(counter.fries).toBe(1);
  expect(s.player.count).toBe(4);
  expect(s.player.fries).toBe(1);
});
it("migrates old single-kind fries trays and rejects impossible mixtures", () => {
  const s = createGame(burger);
  s.level = 3;
  const data = JSON.parse(encodeSave(s, 100));
  Object.assign(data.state.player, { item: "fries", count: 3 });
  delete data.state.player.fries;
  const restored = decodeSave(JSON.stringify(data), burger, 100);
  expect(restored.ok && restored.state.player.fries).toBe(3);
  Object.assign(data.state.player, { item: "raw", count: 3, fries: 1 });
  expect(decodeSave(JSON.stringify(data), burger, 100).ok).toBe(false);
});
it("unloads burgers when the side buffer is full", () => {
  const s = createGame(burger);
  s.level = 3;
  Object.assign(s.player, { x: -5, z: 3.5, item: "meal", count: 5, fries: 2 });
  const counter = s.stations.find((st) => st.id === "counter")!;
  counter.fries = 24;
  interact(s, burger, s.player, [], 0.2);
  expect(counter.output).toBe(1);
  expect(counter.fries).toBe(24);
  expect(s.player.count).toBe(4);
  expect(s.player.fries).toBe(2);
});
