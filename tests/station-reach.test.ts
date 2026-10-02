import { expect, it } from "vitest";
import { burger } from "../../BurgerRush/src/definition";
import { pizza } from "../../PizzaPiazza/src/definition";
import { createGame } from "../src/game/simulation";
import { interact } from "../src/game/production";
import { walkable } from "../src/game/navigation";

for (const game of [burger, pizza]) {
  for (const station of game.stations.filter((st) => st.id !== "drive")) {
    for (const [side, x, z] of [
      ["left", -2, 0],
      ["right", 2, 0],
      ["back", 0, -1.5],
      ["front corner", 2, 1.5],
    ] as const) {
      for (const action of station.kind === "counter"
        ? ["drop"]
        : station.input
          ? ["drop", "pickup"]
          : ["pickup"]) {
        it(`${game.id} ${station.id} ${action} from ${side}`, () => {
          const s = createGame(game);
          s.level = Math.max(12, station.unlock);
          const stock = s.stations.find((st) => st.id === station.id)!;
          s.player.x = station.x + x;
          s.player.z = station.z + z;
          expect(walkable(s.player, game, 0, s.level)).toBe(true);
          if (action === "drop") {
            s.player.item = station.input;
            s.player.count = 1;
          } else stock.output = 1;
          interact(s, game, s.player, [], 0.1);
          expect(s.player.count).toBe(action === "drop" ? 0 : 1);
          if (action === "drop")
            expect(
              station.kind === "counter" ? stock.output : stock.input,
            ).toBe(1);
          else expect(stock.output).toBe(0);
        });
      }
    }
  }
  it(`${game.id} does not collect between kitchen stations`, () => {
    const s = createGame(game);
    s.player.x = -2.8;
    s.player.z = -6.5;
    interact(s, game, s.player, [], 0.1);
    expect(s.player.count).toBe(0);
  });
}
