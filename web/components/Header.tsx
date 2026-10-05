import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";
import { homePath, pagePath } from "@/lib/i18n/segments";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";

export type NavItem = { label: string; href: string };

export function Header({
  locale,
  alternates,
  nav,
}: {
  locale: Locale;
  alternates?: Partial<Record<Locale, string>>;
  /** Domyślnie: Journal, Atlas, O projekcie. Faza 3 dodaje „Ludzie” (slug działu z Sanity). */
  nav?: NavItem[];
}) {
  const dict = getDictionary(locale);
  const items: NavItem[] = nav ?? [
    { label: dict.nav.journal, href: `${homePath(locale)}#opowiesci` },
    { label: dict.nav.atlas, href: pagePath(locale, "atlas") },
    { label: dict.nav.about, href: pagePath(locale, "about") },
  ];

  return (
    <header className="site-header">
      <div>
        <nav className="site-nav" aria-label={dict.nav.aria}>
          {items.map((i) => (
            <Link key={i.href} href={i.href}>
              {i.label}
            </Link>
          ))}
        </nav>
        <details className="menu">
          <summary>{dict.nav.menu}</summary>
          <nav aria-label={dict.nav.aria}>
            {items.map((i) => (
              <Link key={i.href} href={i.href}>
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
