import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { homePath, pagePath } from "@/lib/i18n/segments";
import { categoryPath, type Category } from "@/lib/site";

export type NavItem = { label: string; href: string; title?: string; ariaLabel?: string };

/** Nawigacja z prototypu: Journal, Atlas, Ludzie (dział `people`), O projekcie, ikona „Nowość”. */
export function buildNav(locale: Locale, dict: Dictionary, cats: Category[]): NavItem[] {
  return [
    { label: dict.nav.journal, href: `${homePath(locale)}#opowiesci` },
    { label: dict.nav.atlas, href: pagePath(locale, "atlas") },
    { label: dict.nav.people, href: categoryPath(cats, "people", locale) },
    { label: dict.nav.about, href: pagePath(locale, "about") },
    { label: "🫒", href: `${homePath(locale)}#opowiesci`, title: dict.nav.new, ariaLabel: dict.nav.new },
  ];
}
