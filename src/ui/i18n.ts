import type { Text } from "../game/types";
import cs from "./locales/cs.json";
import sk from "./locales/sk.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";
import pl from "./locales/pl.json";
import nl from "./locales/nl.json";
import uk from "./locales/uk.json";
import ru from "./locales/ru.json";
import ro from "./locales/ro.json";
import hu from "./locales/hu.json";
import tr from "./locales/tr.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import ar from "./locales/ar.json";
import hi from "./locales/hi.json";

export const locales = [
  { code: "en", name: "English" },
  { code: "cs", name: "Čeština" },
  { code: "sk", name: "Slovenčina" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "pl", name: "Polski" },
  { code: "nl", name: "Nederlands" },
  { code: "uk", name: "Українська" },
  { code: "ru", name: "Русский" },
  { code: "ro", name: "Română" },
  { code: "hu", name: "Magyar" },
  { code: "tr", name: "Türkçe" },
  { code: "zh", name: "简体中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
] as const;
export type Locale = (typeof locales)[number]["code"];
export type LanguageChoice = Locale | "auto";
export const dictionaries: Record<
  Exclude<Locale, "en">,
  Record<string, string>
> = {
  cs,
  sk,
  de,
  fr,
  es,
  it,
  pt,
  pl,
  nl,
  uk,
  ru,
  ro,
  hu,
  tr,
  zh,
  ja,
  ko,
  ar,
  hi,
};

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale.code === value);
}
export function detectLocale(preferences: readonly string[]): Locale {
  for (const language of preferences) {
    const base = language.toLowerCase().replaceAll("_", "-").split("-")[0];
    if (isLocale(base)) return base;
  }
  return "en";
}
export function resolveLocale(
  choice: string | null,
  preferences: readonly string[],
): Locale {
  return choice && isLocale(choice) ? choice : detectLocale(preferences);
}
export function translate(key: string, locale: Locale): string {
  return locale === "en" ? key : (dictionaries[locale][key] ?? key);
}
export function localize(value: Text, locale: Locale): string {
  return locale === "cs" ? value.cs : translate(value.en, locale);
}
