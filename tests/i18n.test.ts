import { describe, it, expect } from "vitest";
import {
  detectLocale,
  resolveLocale,
  locales,
  dictionaries,
  translate,
} from "../src/ui/i18n";

describe("language selection and complete dictionaries", () => {
  it("uses browser preference order and regional language fallbacks", () => {
    expect(detectLocale(["xx-XX", "de-AT", "fr"])).toBe("de");
    expect(detectLocale(["pt_BR"])).toBe("pt");
    expect(detectLocale(["zh-Hant-TW"])).toBe("zh");
    expect(detectLocale([])).toBe("en");
  });
  it("keeps explicit choices ahead of device preferences", () => {
    expect(resolveLocale("fr", ["de-DE"])).toBe("fr");
    expect(resolveLocale("auto", ["ar-EG"])).toBe("ar");
    expect(resolveLocale("invalid", ["cs-CZ"])).toBe("cs");
  });
  it("contains every message in all twenty languages", () => {
    const keys = Object.keys(dictionaries.cs).sort();
    expect(locales).toHaveLength(20);
    expect(keys.length).toBeGreaterThanOrEqual(180);
    for (const { code } of locales) {
      if (code === "en") continue;
      expect(Object.keys(dictionaries[code]).sort(), code).toEqual(keys);
      for (const key of keys)
        expect(translate(key, code).trim(), `${code}: ${key}`).not.toBe("");
    }
  });
});
