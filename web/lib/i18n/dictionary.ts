import { DEFAULT_LOCALE, type Locale } from "./locales";
import en from "./dictionaries/en.json";
import pl from "./dictionaries/pl.json";

export type Dictionary = typeof pl;

// Brakujący język (np. `de`) → fallback na język domyślny, bez zmian w komponentach.
const dictionaries: Partial<Record<Locale, Dictionary>> = { pl, en };

export const getDictionary = (locale: Locale): Dictionary =>
  dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE]!;

export const format = (template: string, vars: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
