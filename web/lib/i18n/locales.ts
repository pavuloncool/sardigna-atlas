/**
 * Jedno źródło prawdy dla języków serwisu (odpowiednik studio/lib/languages.ts).
 * `de` jest zarezerwowany: ustaw `enabled: true`, żeby zbudować ścieżki /de/…
 */
export const LOCALES = [
  { id: "pl", title: "Polski", enabled: true },
  { id: "en", title: "English", enabled: true },
  { id: "de", title: "Deutsch", enabled: false },
] as const;

export type Locale = (typeof LOCALES)[number]["id"];

export const ENABLED_LOCALES = LOCALES.filter((l) => l.enabled);
export const locales = ENABLED_LOCALES.map((l) => l.id) as Locale[];
export const DEFAULT_LOCALE: Locale = "pl";

export const isLocale = (value: string): value is Locale =>
  (locales as string[]).includes(value);
