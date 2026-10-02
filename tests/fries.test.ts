import { expect, it } from "vitest";
import { burger } from "../../BurgerRush/src/definition";
import { pizza } from "../../PizzaPiazza/src/definition";
import { createGame, step } from "../src/game/simulation";
import { interact, produce } from "../src/game/production";
import { customers, price } from "../src/game/customers";
import { decodeSave, encodeSave } from "../src/save";

it("unlocks the fryer at expansion three and carries fries to the counter separately", () => {
  const s = createGame(burger),
    fryer = burger.stations.find((x) => x.id === "fryer")!;
  Object.assign(s.player, { x: fryer.x + 2, z: fryer.z });
  interact(s, burger, s.player, [], 0.2);
  expect(s.player.count).toBe(0);
  s.level = 3;
  interact(s, burger, s.player, [], 0.2);
  expect(s.player.item).toBe("fries");
  Object.assign(s.player, { x: -5, z: 3.5 });
  interact(s, burger, s.player, [], 0.2);
  const counter = s.stations.find((x) => x.id === "counter")!;
  expect(counter.fries).toBe(1);
  expect(counter.output).toBe(0);
  expect(s.player.count).toBe(0);
});
it("serves fries as a paid optional side, consumes them once and does not block burger-only sales", () => {
  for (const fries of [0, 2]) {
    const s = createGame(burger);
    s.level = 5;
    Object.assign(s.stations.find((x) => x.id === "counter")!, {
      output: 2,
      fries,
    });
    s.customers = [
      {
        id: 1,
        x: -5,
        z: 3.7,
        state: "queue",
        count: 2,
        timer: 0,
        seat: -1,
        drive: false,
        color: 0,
        fries: 0,
      },
    ];
    s.spawn = 60;
    customers(s, burger, 0.1, []);
    expect(s.customers[0].fries).toBe(fries);
    Object.assign(s.customers[0], { x: 0, z: 3.5, timer: 1 });
    customers(s, burger, 0.1, []);
    expect(s.earned).toBe(2 * price(s, burger) + fries * 4);
    const paid = s.earned;
    customers(s, burger, 0.1, []);
    expect(s.earned).toBe(paid);
    expect(s.stations.find((x) => x.id === "counter")!.fries).toBe(0);
  }
});
it("upgrades old Burger saves without losing money, investments or moving safe players", () => {
  const s = createGame(burger);
  s.money = 321;
  s.paid = 12;
  const data = JSON.parse(encodeSave(s, 100));
  data.state.tables = data.state.tables.slice(0, 4);
  data.state.stations = data.state.stations
    .slice(0, 5)
    .filter((x: { id: string }) => x.id !== "fryer");
  for (const st of data.state.stations) delete st.fries;
  const loaded = decodeSave(JSON.stringify(data), burger, 100);
  expect(loaded.ok).toBe(true);
  if (loaded.ok) {
    expect(loaded.state.money).toBe(321);
    expect(loaded.state.paid).toBe(12);
    expect(loaded.state.stations[4].id).toBe("fryer");
    expect(loaded.state.player).toEqual(s.player);
  }
});
it("safely moves an old player out of the newly added fryer", () => {
  const s = createGame(burger);
  s.level = 3;
  s.player.x = 5.6;
  s.player.z = -6.5;
  const data = JSON.parse(encodeSave(s, 100));
  data.state.stations = data.state.stations.slice(0, 4);
  data.state.tables = data.state.tables.slice(0, 4);
  const loaded = decodeSave(JSON.stringify(data), burger, 100);
  expect(loaded.ok).toBe(true);
  if (loaded.ok) expect(loaded.state.player.x).toBe(-2);
});
it("restores in-flight fries and rejects them in Pizza", () => {
  const s = createGame(burger);
  s.level = 3;
  s.player.item = "fries";
  s.player.count = 2;
  s.player.fries = 2;
  const loaded = decodeSave(encodeSave(s, 100), burger, 100);
  expect(loaded.ok && loaded.state.player.item).toBe("fries");
  const p = createGame(pizza);
  p.player.item = "fries";
  p.player.count = 2;
  expect(decodeSave(encodeSave(p, 100), pizza, 100).ok).toBe(false);
});
it("the automated team delivers and sells fries without starving burgers", () => {
  const s = createGame(burger);
  s.level = 11;
  let friesServed = 0;
  for (let i = 0; i < 6000; i++) {
    step(s, burger, { x: 0, z: 0 }, 0.1);
    friesServed = Math.max(friesServed, ...s.customers.map((c) => c.fries));
  }
  expect(friesServed).toBeGreaterThan(0);
  expect(s.served).toBeGreaterThan(40);
  expect(decodeSave(encodeSave(s, 100), burger, 100).ok).toBe(true);
});
