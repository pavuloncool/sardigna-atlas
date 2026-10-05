import { DEFAULT_LOCALE, type Locale } from "./locales";
import en from "./dictionaries/en.json";
import pl from "./dictionaries/pl.json";

// Formy liczby mnogiej zależą od języka (PL: one/few/many/other, EN: one/other).
export type Dictionary = Omit<typeof pl, "count"> & {
  count: { article: Partial<Record<Intl.LDMLPluralRule, string>> };
};

// Brakujący język (np. `de`) → fallback na język domyślny, bez zmian w komponentach.
const dictionaries: Partial<Record<Locale, Dictionary>> = { pl, en };

export const getDictionary = (locale: Locale): Dictionary =>
  dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE]!;

export const format = (template: string, vars: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");

/** Liczba mnoga wg reguł języka (Intl.PluralRules); brakująca forma → `other`. */
export const plural = (
  locale: Locale,
  n: number,
  forms: Partial<Record<Intl.LDMLPluralRule, string>>,
) => format(forms[new Intl.PluralRules(locale).select(n)] ?? forms.other ?? "{n}", { n: String(n) });
