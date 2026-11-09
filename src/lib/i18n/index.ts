import { en, type MessageKey } from "./en";
import { fr } from "./fr";

export type Lang = "fr" | "en";
export type { MessageKey };

export const LANGS: { id: Lang; label: string }[] = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
];

/** French is the default for people who have not chosen a language yet. */
export const DEFAULT_LANG: Lang = "fr";

const catalogs: Record<Lang, Record<MessageKey, string>> = { en, fr };

export const isLang = (v: unknown): v is Lang => v === "fr" || v === "en";

type Params = Record<string, string | number>;

function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

/** French typography: a non-breaking space before : ; ? ! » and after «. */
function typography(lang: Lang, text: string): string {
  return lang === "fr" ? text.replace(/ ([:;?!»])/g, " $1").replace(/« /g, "« ") : text;
}

export function t(lang: Lang, key: MessageKey, params?: Params): string {
  const raw = catalogs[lang][key] ?? en[key] ?? key;
  return typography(lang, interpolate(raw, params));
}

/** Plural-aware lookup: uses `<key>_one` / `<key>_other` according to the language's plural rules. */
export function tn(lang: Lang, key: string, n: number, params?: Params): string {
  const rule = new Intl.PluralRules(lang).select(n);
  const k = `${key}_${rule === "one" ? "one" : "other"}` as MessageKey;
  return t(lang, k, { n, ...params });
}

export const localeOf = (lang: Lang): string => (lang === "fr" ? "fr-FR" : "en-GB");

export function formatNumber(lang: Lang, n: number): string {
  return new Intl.NumberFormat(localeOf(lang)).format(n);
}

export function formatBytes(lang: Lang, bytes: number): string {
  const units = lang === "fr" ? ["o", "Ko", "Mo", "Go"] : ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const digits = i >= 2 ? 1 : 0;
  return `${new Intl.NumberFormat(localeOf(lang), { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(v)} ${units[i]}`;
}

/** "Monday, 9 November 2026" / "lundi 9 novembre 2026" from an ISO date (UTC). */
export function formatDateLong(lang: Lang, isoDate: string): string {
  return new Intl.DateTimeFormat(localeOf(lang), { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(isoDate + "T00:00:00Z"));
}

export { dateLabel, mediumLabel, movementLabel, periodLabel } from "./glossary";
