import { it, expect } from "vitest";
import { InputState } from "../src/input";
it("normalizes diagonals and releases all input on reset", () => {
  const i = new InputState();
  i.keys.add("KeyW");
  i.keys.add("KeyD");
  expect(Math.hypot(i.read().x, i.read().z)).toBeCloseTo(1);
  i.reset();
  expect(i.read()).toEqual({ x: 0, z: 0 });
});
it("does not let a second touch steal an active gesture", () => {
  const i = new InputState();
  expect(i.begin(1, 20, 20)).toBe(true);
  expect(i.begin(2, 50, 50)).toBe(false);
  i.drag(2, 200, 200);
  expect(i.read()).toEqual({ x: 0, z: 0 });
  i.drag(1, 100, 20);
  expect(Math.hypot(i.read().x, i.read().z)).toBeCloseTo(1);
  i.end(2);
  expect(i.pointer).toBe(1);
  i.end(1);
  expect(i.read()).toEqual({ x: 0, z: 0 });
});
