import { it, expect, describe } from "vitest";
import { createGame, step, command, upgradeCost } from "../src/game/simulation";
import { route, distance } from "../src/game/navigation";
import { capacity } from "../src/game/production";
import { REGISTER, TRASH, type Vec } from "../src/game/types";
import { burger } from "../../BurgerRush/src/definition";
import { pizza } from "../../PizzaPiazza/src/definition";
describe.each([burger, pizza])("$id full progression", (d) => {
  it("an active operator reaches completion without outside currency", () => {
    const s = createGame(d);
    let target = "source",
      waypoints: Vec[] = [],
      previous = "",
      wait = 0;
    const unlockTimes: number[] = [];
    for (let i = 0; i < 240000 && s.level < 12; i++) {
      const next = d.unlocks[s.level];
      if (s.money >= next.cost - s.paid) {
        command(s, d, { type: "unlock" });
        unlockTimes.push(Math.round(s.time));
      }
      const unlocked = d.recipeLevels.reduce(
        (last, l, i) => (s.level >= l ? i : last),
        0,
      );
      if (unlocked !== s.recipe)
        command(s, d, { type: "recipe", index: unlocked });
      for (const key of [
        "capacity",
        "income",
        "speed",
        "staff",
        "production",
      ] as const)
        if (
          s.upgrades[key] < (key === "income" ? 3 : 2) &&
          s.level >= 3 &&
          upgradeCost(s, key) < next.cost * 0.25 &&
          s.money >= upgradeCost(s, key)
        )
          command(s, d, { type: "upgrade", id: key });
      if (s.player.item === "trash") target = "trash";
      const st = d.stations.find((x) => x.id === target),
        stock = s.stations.find((x) => x.id === target),
        at =
          target === "trash"
            ? TRASH
            : target === "register"
              ? REGISTER
              : st
                ? { x: st.x, z: st.z + 1.5 }
                : REGISTER;
      if (distance(s.player, at) < 0.3) {
        wait += 1 / 30;
        if (target === "trash") {
          if (!s.player.count) target = "source";
        } else if (target === "register") {
          if (wait > 2 && !s.customers.some((c) => c.state === "pay"))
            target = "source";
        } else if (st && stock) {
          if (
            (s.player.count >= capacity(s) && s.player.item === st.output) ||
            (wait > 1 &&
              s.player.count > 0 &&
              s.player.item === st.output &&
              stock.output === 0 &&
              stock.input === 0)
          ) {
            target =
              s.player.item === "raw"
                ? "prep"
                : s.player.item === "prep"
                  ? "oven"
                  : "counter";
          } else if (st.kind === "counter" && s.player.count === 0) {
            target = s.level < 5 ? "register" : "source";
          } else if (
            s.player.count === 0 &&
            wait > 3 &&
            stock.input === 0 &&
            stock.output === 0
          )
            target = "source";
        }
      }
      if (s.player.count === 0 && target === "source") {
        const ready = [...d.stations]
          .reverse()
          .find(
            (x) =>
              x.kind !== "counter" &&
              x.kind !== "source" &&
              s.stations.find((st) => st.id === x.id)!.output > 0,
          );
        if (ready) target = ready.id;
      }
      const dest =
        target === "trash"
          ? TRASH
          : target === "register"
            ? REGISTER
            : {
                x: d.stations.find((x) => x.id === target)!.x,
                z: d.stations.find((x) => x.id === target)!.z + 1.5,
              };
      if (target !== previous) {
        waypoints = route(s.player, dest, d, s.level).slice();
        previous = target;
        wait = 0;
      }
      while (waypoints.length && distance(s.player, waypoints[0]) < 0.15)
        waypoints.shift();
      const p = waypoints[0],
        dist = p ? distance(s.player, p) : 0;
      step(
        s,
        d,
        p && dist
          ? { x: (p.x - s.player.x) / dist, z: (p.z - s.player.z) / dist }
          : { x: 0, z: 0 },
        1 / 30,
      );
    }
    console.log("balance", d.id, {
      minutes: Math.round(s.time / 6) / 10,
      level: s.level,
      unlocks: unlockTimes,
    });
    expect(s.level).toBe(12);
    expect(s.time).toBeLessThanOrEqual(2100);
    expect(s.time).toBeGreaterThanOrEqual(1500);
    expect(unlockTimes[0]).toBeLessThanOrEqual(20);
  }, 30000);
});
