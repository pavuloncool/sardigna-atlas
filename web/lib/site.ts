import { cache } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { DEFAULT_LOCALE, isLocale, locales } from "@/lib/i18n/locales";
import { segment, type SegmentKey } from "@/lib/i18n/segments";
import { client } from "@/lib/sanity/client";
import {
  articleRoutesQuery,
  categoriesQuery,
  entityRoutesQuery,
} from "@/lib/sanity/queries";
import type { SanityImage } from "@/lib/sanity/image";

type Localized = Partial<Record<string, string | null>> | null | undefined;

/** Wartość pola wielojęzycznego z fallbackiem: język → en → język domyślny. */
export const localized = (v: Localized, locale: Locale): string =>
  v?.[locale] ?? v?.en ?? v?.[DEFAULT_LOCALE] ?? "";

export type Category = {
  _id: string;
  key: string;
  name: Localized;
  slugs: Localized;
  intro?: Localized;
  order: number | null;
  cover: SanityImage | null;
};

export const getCategories = cache(
  async () => (await client.fetch<Category[]>(categoriesQuery)) ?? [],
);

export const categorySlug = (c: Category, locale: Locale) => localized(c.slugs, locale) || c.key;
export const categoryName = (c: Category, locale: Locale) => localized(c.name, locale) || c.key;

export const categoryPath = (cats: Category[], key: string, locale: Locale) => {
  const c = cats.find((x) => x.key === key);
  return `/${locale}/${c ? categorySlug(c, locale) : key}/`;
};

/** Strony statyczne obsługiwane przez `[section]` (segment tłumaczony per język). */
export const STATIC_SECTIONS = ["atlas", "authors", "about", "contact", "privacy", "cookies"] as const satisfies SegmentKey[];
export type StaticSection = (typeof STATIC_SECTIONS)[number];

export type Section =
  | { kind: "category"; category: Category }
  | { kind: "static"; page: StaticSection };

/** Rozwiązuje segment `[section]` w danym języku: dział albo strona statyczna. */
export async function resolveSection(locale: Locale, slug: string): Promise<Section | null> {
  const page = STATIC_SECTIONS.find((p) => segment(p, locale) === slug);
  if (page) return { kind: "static", page };
  const category = (await getCategories()).find((c) => categorySlug(c, locale) === slug);
  return category ? { kind: "category", category } : null;
}

export async function sectionParams() {
  const cats = await getCategories();
  return locales.flatMap((locale) => [
    ...STATIC_SECTIONS.map((p) => ({ locale, section: segment(p, locale) })),
    ...cats.map((c) => ({ locale, section: categorySlug(c, locale) })),
  ]);
}

export type ArticleRoute = { slug: string; language: Locale; categoryKey: string };
export const getArticleRoutes = async () =>
  (await client.fetch<ArticleRoute[]>(articleRoutesQuery)) ?? [];

export type EntityRoute = { _type: string; slug: string };
export const getEntityRoutes = async () =>
  (await client.fetch<EntityRoute[]>(entityRoutesQuery)) ?? [];

/** Adresy artykułu we wszystkich dostępnych językach (przełącznik języka, hreflang). */
export function articleAlternates(
  cats: Category[],
  categoryKey: string | undefined,
  translations: { slug: string; language: string }[] | null | undefined,
) {
  const cat = cats.find((c) => c.key === categoryKey);
  const out: Partial<Record<Locale, string>> = {};
  for (const t of translations ?? []) {
    if (!cat || !isLocale(t.language)) continue;
    out[t.language] = `/${t.language}/${categorySlug(cat, t.language)}/${t.slug}/`;
  }
  return out;
}

export const allLocales = <T,>(path: (l: Locale) => T) =>
  Object.fromEntries(locales.map((l) => [l, path(l)])) as Record<Locale, T>;
