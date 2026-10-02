import { describe, it, expect } from "vitest";
import { createGame, step, command } from "../src/game/simulation";
import { burger } from "../../BurgerRush/src/definition";
import { pizza } from "../../PizzaPiazza/src/definition";

describe.each([burger, pizza])("$id simulation", (def) => {
  it("collects no more than carrier capacity", () => {
    const s = createGame(def);
    s.player.x = def.stations[0].x;
    s.player.z = def.stations[0].z + 1.5;
    for (let i = 0; i < 100; i++) step(s, def, { x: 0, z: 0 }, 0.1);
    expect(s.player.count).toBe(5);
    expect(s.player.item).toBe("raw");
  });
  it("converts one input exactly once", () => {
    const s = createGame(def);
    s.stations[1].input = 1;
    for (let i = 0; i < 100; i++) step(s, def, { x: 0, z: 0 }, 0.1);
    expect(s.stations[1].input).toBe(0);
    expect(s.stations[1].output).toBe(1);
  });
  it("rejects unaffordable purchases without changing balance", () => {
    const s = createGame(def);
    expect(command(s, def, { type: "upgrade", id: "speed" })).toBe(false);
    expect(s.money).toBe(0);
    expect(s.upgrades.speed).toBe(0);
  });
  it("retains partial unlock payment and finishes only once", () => {
    const s = createGame(def);
    s.money = 10;
    expect(command(s, def, { type: "unlock" })).toBe(true);
    expect(s.paid).toBe(10);
    expect(s.level).toBe(0);
    s.money = 20;
    command(s, def, { type: "unlock" });
    expect(s.level).toBe(1);
    expect(s.money).toBe(def.id === "pizza" ? 6 : 0);
  });
  it("disposes wrong carried items and recovers capacity", () => {
    const s = createGame(def);
    s.player.item = "raw";
    s.player.count = 5;
    s.player.x = -7;
    s.player.z = 7;
    for (let i = 0; i < 12; i++) step(s, def, { x: 0, z: 0 }, 0.1);
    expect(s.player.count).toBe(0);
    expect(s.player.item).toBe(null);
  });
  it("never charges a customer twice", () => {
    const s = createGame(def);
    s.stations.find((x) => x.id === "counter")!.output = 12;
    s.player.x = 0;
    s.player.z = 0.5;
    for (let i = 0; i < 150; i++) step(s, def, { x: 0, z: 0 }, 0.1);
    expect(s.served).toBeGreaterThan(0);
    expect(s.earned).toBe(s.sold * def.price);
  });
});
