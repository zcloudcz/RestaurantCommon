import { describe, it, expect } from "vitest";
import { createGame, command, refreshDay } from "../src/game/simulation";
import { encodeSave, decodeSave } from "../src/save";
import { burger } from "../../BurgerRush/src/definition";
describe("save boundary", () => {
  it("rejects game-incompatible items and unreachable carrier positions", () => {
    for (const change of [
      { item: "prep", count: 1 },
      { x: 30, z: 30 },
    ]) {
      const s = createGame(burger);
      const raw = JSON.stringify({
        state: { ...s, player: { ...s.player, ...change } },
        savedAt: Date.now(),
      });
      expect(decodeSave(raw, burger, Date.now()).ok).toBe(false);
    }
  });
  it("migrates v0 saves without losing earnings", () => {
    const s = createGame(burger);
    s.money = 84;
    const raw = JSON.stringify({
      state: { ...s, version: 0, skin: undefined, daily: undefined },
      savedAt: Date.now(),
    });
    const result = decodeSave(raw, burger, Date.now());
    expect(result.ok && result.state.money).toBe(84);
    expect(result.ok && result.state.version).toBe(1);
  });
  it("accepts real epoch millisecond timestamps", () => {
    const now = Date.UTC(2026, 8, 30),
      s = createGame(burger);
    s.level = 1;
    const result = decodeSave(encodeSave(s, now), burger, now + 1000);
    expect(result.ok && result.state.level).toBe(1);
  });
  it("preserves partial payments and separate game IDs", () => {
    const s = createGame(burger);
    s.money = 10;
    command(s, burger, { type: "unlock" });
    const raw = encodeSave(s, 100000);
    const result = decodeSave(raw, burger, 100000);
    expect(result.ok && result.state.paid).toBe(10);
    expect(decodeSave(raw, { ...burger, id: "pizza" }, 100000).ok).toBe(false);
  });
  it("rejects corrupt, future, negative and oversized saves", () => {
    const s = createGame(burger);
    for (const raw of [
      "garbage",
      "x".repeat(500001),
      JSON.stringify({ version: 99 }),
      encodeSave({ ...s, money: -4 }, 100),
    ])
      expect(decodeSave(raw, burger, 200).ok).toBe(false);
  });
  it("caps offline income and rejects negative elapsed time", () => {
    const s = createGame(burger);
    s.level = 11;
    const raw = encodeSave(s, 10000000);
    const a = decodeSave(raw, burger, 10000000 + 7200000),
      b = decodeSave(raw, burger, 10000000 + 90000000);
    expect(a.ok && a.offline).toBeGreaterThan(0);
    expect(a.ok && a.offline).toBe(b.ok && b.offline);
    const back = decodeSave(raw, burger, 1);
    expect(back.ok && back.offline).toBe(0);
  });
  it("does not grant production without transport automation", () => {
    const s = createGame(burger);
    s.level = 7;
    const result = decodeSave(encodeSave(s, 1000), burger, 10000000);
    expect(result.ok && result.offline).toBe(0);
  });
  it("cannot reclaim a daily reward and ignores a backwards day", () => {
    const s = createGame(burger);
    s.daily.served = 20;
    expect(command(s, burger, { type: "claim", index: 0 })).toBe(true);
    expect(command(s, burger, { type: "claim", index: 0 })).toBe(false);
    expect(s.money).toBe(100);
    const day = s.daily.day;
    refreshDay(s, 0);
    expect(s.daily.day).toBe(day);
  });
});
