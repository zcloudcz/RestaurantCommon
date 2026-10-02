import { describe, expect, it } from "vitest";
import { burger } from "../../BurgerRush/src/definition";
import { pizza } from "../../PizzaPiazza/src/definition";
import { createGame, command, step } from "../src/game/simulation";
import {
  move,
  route,
  walkable,
  toward,
  distance,
} from "../src/game/navigation";
import { seats, interact, produce } from "../src/game/production";
import { customers } from "../src/game/customers";
import { staff } from "../src/game/staff";
import { TABLES, HOME } from "../src/game/types";
import { encodeSave, decodeSave } from "../src/save";

describe.each([burger, pizza])("$id physical expansions", (d) => {
  it("opens connected walkable rooms only at their purchased level", () => {
    for (const [level, x, z] of [
      [13, 10, 5],
      [14, 5, 16],
      [15, 2, -14],
      [16, 16, -7],
      [18, 0, 20],
    ]) {
      const end = { x, z };
      expect(walkable(end, d, 0, level - 1)).toBe(false);
      expect(route(HOME, end, d, level - 1)).toEqual([]);
      expect(walkable(end, d, 0, level)).toBe(true);
      const path = route(HOME, end, d, level);
      expect(path.length).toBeGreaterThan(1);
      expect(path.every((p) => walkable(p, d, 0, level))).toBe(true);
      const actor = { ...HOME };
      for (let i = 0; i < 1500 && distance(actor, end) > 0.1; i++)
        toward(actor, end, 4, 0.1, d, level);
      expect(distance(actor, end)).toBeLessThan(0.1);
    }
    expect(
      route({ x: 2, z: -14 }, { x: 16, z: 20 }, d, 18).length,
    ).toBeGreaterThan(50);
  });
  it("only activates purchased tables and keeps terrace guests alive", () => {
    const s = createGame(d);
    for (const [level, count] of [
      [0, 0],
      [12, 4],
      [13, 8],
      [14, 12],
      [17, 14],
    ]) {
      s.level = level;
      expect(seats(s)).toBe(count);
    }
    s.level = 14;
    s.spawn = 60;
    s.tables.forEach((t, i) => {
      t.dirty = i < 8;
    });
    s.customers = [
      {
        id: 1,
        x: 0,
        z: 3.5,
        state: "pay",
        count: 1,
        timer: 1,
        seat: -1,
        drive: false,
        color: 0,
        fries: 0,
      },
    ];
    customers(s, d, 0.1, []);
    expect(s.customers[0].seat).toBe(8);
    for (let i = 0; i < 70; i++) customers(s, d, 0.1, []);
    expect(s.customers.some((c) => c.id === 1)).toBe(true);
    expect(s.tables[8].dirty || s.customers[0].state === "eat").toBe(true);
    expect(s.tables.slice(12).every((t) => t.customer === -1 && !t.dirty)).toBe(
      true,
    );
  });
  it("rightmost original tables finish meals without buying an expansion", () => {
    for (const seat of [1, 3]) {
      const s = createGame(d);
      s.level = 6;
      s.spawn = 60;
      s.tables[seat].customer = 1;
      s.customers = [
        {
          id: 1,
          x: 0,
          z: 3.5,
          state: "eat",
          count: 1,
          timer: 0,
          seat,
          drive: false,
          color: 0,
          fries: 0,
        },
      ];
      for (let i = 0; i < 200; i++) customers(s, d, 0.1, []);
      expect(s.tables[seat].dirty).toBe(true);
      expect(s.tables[seat].customer).toBe(-1);
    }
  });
  it("annex accepts ingredients and produces collectible meals", () => {
    const s = createGame(d),
      def = d.stations.find((st) => st.id === "annex")!;
    const stock = s.stations.find((st) => st.id === def.id)!;
    s.level = 15;
    Object.assign(s.player, { x: 0, z: -11.5, item: def.input, count: 1 });
    interact(s, d, s.player, [], 0.2, "annex");
    expect(stock.input).toBe(1);
    produce(s, d, 2);
    interact(s, d, s.player, [], 0.2, "annex");
    expect(s.player.item).toBe("meal");
    expect(s.player.count).toBe(1);
  });
  it("staff operates the annex and express customers buy from the new counter", () => {
    const s = createGame(d);
    s.level = 16;
    let annexFed = false,
      dispatchFed = false,
      dispatchSold = false;
    for (
      let i = 0;
      i < 12000 && !(annexFed && dispatchFed && dispatchSold);
      i++
    ) {
      const events = step(s, d, { x: 0, z: 0 }, 0.1);
      annexFed ||= events.some(
        (e) => e.type === "drop" && e.x === 0 && e.z === -13,
      );
      dispatchFed ||= events.some(
        (e) => e.type === "drop" && e.x === 13 && e.z === -5,
      );
      dispatchSold ||= events.some(
        (e) => e.type === "sale" && e.x === 13 && e.z === -2,
      );
    }
    expect({ annexFed, dispatchFed, dispatchSold }).toEqual({
      annexFed: true,
      dispatchFed: true,
      dispatchSold: true,
    });
    expect(decodeSave(encodeSave(s, 100), d, 100).ok).toBe(true);
  }, 30000);
  it("migrates exact old layouts while preserving bought bonuses and furniture", () => {
    const s = createGame(d);
    s.level = 18;
    s.money = 1234;
    s.recipe = 3;
    s.upgrades.staff = 2;
    s.tables[1].dirty = true;
    s.stations[1].input = 3;
    const old = JSON.parse(encodeSave(s, 100));
    old.state.tables = old.state.tables.slice(0, 4);
    old.state.stations = old.state.stations.slice(0, 5);
    const loaded = decodeSave(JSON.stringify(old), d, 100);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.tables).toHaveLength(TABLES.length);
    expect(loaded.state.tables[1].dirty).toBe(true);
    expect(loaded.state.stations[1].input).toBe(3);
    expect(loaded.state.money).toBe(1234);
    expect(loaded.state.level).toBe(18);
    expect(loaded.state.recipe).toBe(3);
    expect(loaded.state.upgrades.staff).toBe(2);
    old.state.stations.splice(1, 1);
    expect(decodeSave(JSON.stringify(old), d, 100).ok).toBe(false);
  });
  it("restores expansion positions only when their floor has been purchased", () => {
    const s = createGame(d);
    s.level = 18;
    s.player.x = 0;
    s.player.z = 20;
    expect(decodeSave(encodeSave(s, 100), d, 100).ok).toBe(true);
    s.level = 17;
    expect(decodeSave(encodeSave(s, 100), d, 100).ok).toBe(false);
  });
  it("moves actors safely when lounge furniture is purchased underneath them", () => {
    const s = createGame(d);
    s.level = 16;
    s.money = d.unlocks[16].cost;
    Object.assign(s.player, TABLES[12]);
    expect(command(s, d, { type: "unlock" })).toBe(true);
    expect(walkable(s.player, d, 0.1, 17)).toBe(true);
    expect(decodeSave(encodeSave(s, 100), d, 100).ok).toBe(true);
  });
});

it("retargets a full delivery buffer instead of permanently waiting with fries", () => {
  const s = createGame(burger);
  s.level = 16;
  s.stations.find((st) => st.id === "drive")!.fries = 24;
  const worker = {
    ...s.player,
    x: -7,
    z: 0,
    role: "server" as const,
    item: "fries" as const,
    count: 2,
    fries: 2,
    target: "drive",
  };
  s.workers.push(worker);
  staff(s, burger, 0.1, []);
  expect(worker.target).toBe("counter");
  for (let i = 0; i < 200; i++) staff(s, burger, 0.1, []);
  expect(s.stations.find((st) => st.id === "counter")!.fries).toBeGreaterThan(
    0,
  );
});

it("follows an interrupted annex route into the express wing without sticking at the concave corner", () => {
  for (const d of [burger, pizza])
    for (const z of [-10.1, -10.166666666666666, -11.5]) {
      const actor = { x: 0, z };
      const destination = { x: 13, z: -3.5 };
      const waypoints = route(actor, destination, d, 18).slice();
      // Replay the older, looser browser threshold too: floor clearance must make
      // these turns safe even before the player lands exactly on each grid point.
      for (let i = 0; i < 1200 && waypoints.length; i++) {
        while (waypoints.length && distance(actor, waypoints[0]) < 0.15)
          waypoints.shift();
        const point = waypoints[0];
        if (!point) break;
        const dist = distance(actor, point);
        move(
          actor,
          { x: (point.x - actor.x) / dist, z: (point.z - actor.z) / dist },
          Math.min(dist, d.speed / 30),
          d,
          18,
        );
      }
      expect(distance(actor, destination)).toBeLessThan(0.15);
    }
});
