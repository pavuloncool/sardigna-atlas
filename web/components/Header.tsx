import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";
import { categoryPath } from "@/lib/i18n/categorySlugs";
import { homePath, pagePath } from "@/lib/i18n/segments";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";

export type NavItem = { label: string; href: string; title?: string; ariaLabel?: string };

export function Header({
  locale,
  alternates,
  nav,
}: {
  locale: Locale;
  alternates?: Partial<Record<Locale, string>>;
  /** Domyślnie: Journal, Atlas, Ludzie, O projekcie + ikona „Nowość” (jak w prototypie). */
  nav?: NavItem[];
}) {
  const dict = getDictionary(locale);
  const items: NavItem[] = nav ?? [
    { label: dict.nav.journal, href: `${homePath(locale)}#opowiesci` },
    { label: dict.nav.atlas, href: pagePath(locale, "atlas") },
    { label: dict.nav.people, href: categoryPath("people", locale) },
    { label: dict.nav.about, href: pagePath(locale, "about") },
    { label: "🫒", href: `${homePath(locale)}#opowiesci`, title: dict.nav.new, ariaLabel: dict.nav.new },
  ];

  return (
    <header className="site-header">
      <div>
        <nav className="site-nav" aria-label={dict.nav.aria}>
          {items.map((i) => (
            <Link key={i.label} href={i.href} title={i.title} aria-label={i.ariaLabel}>
              {i.label}
            </Link>
          ))}
        </nav>
        <details className="menu">
          <summary>{dict.nav.menu}</summary>
          <nav aria-label={dict.nav.aria}>
            {items.map((i) => (
              <Link key={i.label} href={i.href} title={i.title} aria-label={i.ariaLabel}>
                {i.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
      <Link className="brand" id="brand" href={homePath(locale)} aria-label={dict.homeAria}>
        <Wordmark />
      </Link>
      <div className="header-right">
        <SearchBox locale={locale} />
        <LanguageSwitcher locale={locale} alternates={alternates} />
        <ThemeToggle label={dict.theme.toggle} />
      </div>
    </header>
  );
}
