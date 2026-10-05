import { DEFAULT_LOCALE, type Locale } from "./locales";

/**
 * Tłumaczone segmenty URL (sekcja 5 briefu). Brakujący język (np. `de`) spada na
 * `en`, potem na język domyślny, więc dodanie języka nie wymaga zmian w komponentach.
 * Slugi działów NIE są tutaj: pochodzą z Sanity (`category.slugs`).
 */
const SEGMENTS = {
  atlas: { pl: "atlas", en: "atlas" },
  places: { pl: "miejsca", en: "places" },
  people: { pl: "ludzie", en: "people" },
  products: { pl: "produkty", en: "products" },
  stays: { pl: "noclegi", en: "stays" },
  experiences: { pl: "doswiadczenia", en: "experiences" },
  about: { pl: "o-projekcie", en: "about" },
  contact: { pl: "kontakt", en: "contact" },
  privacy: { pl: "polityka-prywatnosci", en: "privacy-policy" },
  cookies: { pl: "polityka-cookies", en: "cookie-policy" },
  pagination: { pl: "strona", en: "page" },
} as const satisfies Record<string, Partial<Record<Locale, string>>>;

export type SegmentKey = keyof typeof SEGMENTS;

export function segment(key: SegmentKey, locale: Locale): string {
  const map: Partial<Record<Locale, string>> = SEGMENTS[key];
  return map[locale] ?? map.en ?? map[DEFAULT_LOCALE]!;
}

/** Typ dokumentu encji (Sanity) → klucz segmentu w sekcji Atlas. */
const ENTITY_SEGMENT = {
  place: "places",
  person: "people",
  product: "products",
  hotel: "stays",
  experience: "experiences",
} as const satisfies Record<string, SegmentKey>;

export type EntityType = keyof typeof ENTITY_SEGMENT;

export const entitySegmentKey = (t: EntityType): SegmentKey => ENTITY_SEGMENT[t];

export const isEntityType = (t: string): t is EntityType => t in ENTITY_SEGMENT;

/** Encje mają wspólny slug we wszystkich językach. */
export function entityPath(locale: Locale, type: EntityType, slug: string): string {
  return `/${locale}/${segment("atlas", locale)}/${segment(ENTITY_SEGMENT[type], locale)}/${slug}/`;
}

/** Artykuły mają slug per język; segment działu pochodzi z Sanity. */
export function articlePath(locale: Locale, categorySlug: string, slug: string): string {
  return `/${locale}/${categorySlug}/${slug}/`;
}

export const homePath = (locale: Locale) => `/${locale}/`;
export const pagePath = (locale: Locale, key: SegmentKey) => `/${locale}/${segment(key, locale)}/`;

/** Strona N działu (N ≥ 2): `strona-2` (PL), `page-2` (EN). Strona 1 to adres samego działu. */
export const paginationSlug = (locale: Locale, n: number) => `${segment("pagination", locale)}-${n}`;

export function parsePaginationSlug(locale: Locale, slug: string): number | null {
  const m = new RegExp(`^${segment("pagination", locale)}-(\\d+)$`).exec(slug);
  const n = m ? Number(m[1]) : NaN;
  return n >= 2 ? n : null;
}
