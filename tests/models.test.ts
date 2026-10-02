import { expect, it } from "vitest";
import * as T from "three";
import { food } from "../src/render/models";
import { pizza } from "../../PizzaPiazza/src/definition";

it("garden pizza has distinct vegetable toppings from Margherita and pepperoni", () => {
  const colors = (recipe: number) => {
    const result: string[] = [];
    food(pizza, "meal", recipe).traverse((o) => {
      if (o instanceof T.Mesh)
        result.push(
          (o.material as T.MeshStandardMaterial).color.getHexString(),
        );
    });
    return result;
  };
  expect(colors(2)).not.toEqual(colors(0));
  expect(colors(2)).not.toEqual(colors(1));
});

it('signature dishes are visually distinct from the previous premium recipes', async () => {
  const { burger } = await import('../../BurgerRush/src/definition');
  for (const d of [burger, pizza]) {
    const signature = (recipe: number) => {
      const result: string[] = [];
      food(d, 'meal', recipe).traverse(o => {
        if (o instanceof T.Mesh) result.push((o.material as T.MeshStandardMaterial).color.getHexString());
      });
      return result;
    };
    expect(signature(3)).not.toEqual(signature(2));
  }
});
