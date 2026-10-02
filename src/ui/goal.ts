import { expansionChoices, expansionPaid } from "../game/types";
import { hasExpansion } from "../game/types";
import {
  REGISTER,
  TRASH,
  PLOT,
  type GameState,
  type GameDefinition,
  type Vec,
  type Text,
} from "../game/types";
export function goal(
  s: GameState,
  d: GameDefinition,
): { id: string; position: Vec; text: Text } {
  let id = "source",
    text: Text = {
      cs:
        d.id === "pizza" ? "Vyzvedni čerstvé těsto" : "Vyzvedni placky z grilu",
      en: d.id === "pizza" ? "Pick up fresh dough" : "Pick up grilled patties",
    };
  if (s.player.item === "trash")
    return {
      id: "trash",
      position: TRASH,
      text: { cs: "Odnes odpadky do koše", en: "Take the trash to the bin" },
    };
  if (
    expansionChoices(s, d.unlocks.length).some(
      (id) => s.money >= d.unlocks[id - 1].cost - expansionPaid(s, id),
    )
  )
    return {
      id: "unlock",
      position: PLOT,
      text: {
        cs: "Máš na další rozšíření!",
        en: "Your next expansion is ready!",
      },
    };
  if (s.player.item === "raw") {
    id = "prep";
    text = {
      cs:
        d.id === "pizza"
          ? "Přidej omáčku a ingredience"
          : "Odnes placky k sestavení",
      en:
        d.id === "pizza"
          ? "Add sauce and toppings"
          : "Take patties to assembly",
    };
  } else if (s.player.item === "prep") {
    id = "oven";
    text = {
      cs: "Vlož připravené pizzy do pece",
      en: "Take your pizzas to the oven",
    };
  } else if (s.player.item === "meal" || s.player.item === "fries") {
    id = "counter";
    text = {
      cs: "Doplň jídlo na výdejní pult",
      en: "Stock the serving counter",
    };
  } else if (
    !hasExpansion(s, 5) &&
    (s.cash > 0 ||
      s.customers.some((c) => c.state === "pay") ||
      (s.stations.find((x) => x.id === "counter")?.output ?? 0) > 0)
  )
    return {
      id: "register",
      position: REGISTER,
      text: {
        cs: "Obsluž pokladnu a vyber tržby",
        en: "Take payments at the register",
      },
    };
  else {
    const fryer = d.stations.find((st) => st.id === "fryer");
    const counter = s.stations.find((st) => st.id === "counter");
    if (
      fryer &&
      hasExpansion(s, fryer.unlock) &&
      counter &&
      counter.output >= 2 &&
      counter.fries < 2
    ) {
      return {
        id: "fryer",
        position: { x: fryer.x, z: fryer.z + 1.5 },
        text: { cs: "Vyzvedni čerstvé hranolky", en: "Pick up fresh fries" },
      };
    }
    const ready = d.stations.find(
      (st, i) =>
        st.kind !== "counter" &&
        st.kind !== "source" &&
        s.stations[i].output > 0,
    );
    if (ready) {
      id = ready.id;
      text = {
        cs:
          ready.output === "meal"
            ? "Vyzvedni hotové jídlo"
            : "Vyzvedni připravené pizzy",
        en:
          ready.output === "meal"
            ? "Pick up the finished food"
            : "Pick up the prepared pizzas",
      };
    }
  }
  const station = d.stations.find((st) => st.id === id)!;
  return { id, position: { x: station.x, z: station.z + 1.5 }, text };
}
