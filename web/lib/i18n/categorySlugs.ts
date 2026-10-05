import type { Locale } from "./locales";

/**
 * TYMCZASOWE: slugi sześciu działów do czasu podpięcia danych z Sanity (faza 2/3,
 * `category.slugs`). Źródłem prawdy po fazie 2 jest seed i Studio, nie ta tabela.
 */
const SLUGS: Record<string, Partial<Record<Locale, string>>> = {
  food: { pl: "kulinaria", en: "food" },
  craft: { pl: "rekodzielo", en: "craft" },
  stay: { pl: "hotele", en: "stays" },
  experiences: { pl: "doswiadczenia", en: "experiences" },
  history: { pl: "historia", en: "history" },
  people: { pl: "ludzie", en: "people" },
};

export function categoryPath(key: string, locale: Locale): string {
  const slug = SLUGS[key]?.[locale] ?? SLUGS[key]?.en ?? key;
  return `/${locale}/${slug}/`;
}
