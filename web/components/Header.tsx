import Link from "@/components/Link";
import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";
import { homePath } from "@/lib/i18n/segments";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";
import type { NavItem } from "@/lib/nav";

export function Header({
  locale,
  alternates,
  nav,
}: {
  locale: Locale;
  alternates?: Partial<Record<Locale, string>>;
  /** Budowane przez PageShell (lib/nav.ts): Journal, Atlas, Ludzie, O projekcie, Home. */
  nav: NavItem[];
}) {
  const dict = getDictionary(locale);
  const items = nav;

  return (
    <header className="site-header">
      <div>
        <nav className="site-nav" aria-label={dict.nav.aria}>
          {items.map((i) => (
            <Link key={i.label} href={i.href} title={i.title}>
              {i.ariaLabel ? (
                <>
                  <span aria-hidden="true">{i.label}</span>
                  <span className="sr">{i.ariaLabel}</span>
                </>
              ) : (
                i.label
              )}
            </Link>
          ))}
        </nav>
        <details className="menu">
          <summary>{dict.nav.menu}</summary>
          <nav aria-label={dict.nav.aria}>
            {items.map((i) => (
              <Link key={i.label} href={i.href} title={i.title}>
                {i.ariaLabel ? (
                  <>
                    <span aria-hidden="true">{i.label}</span>
                    <span className="sr">{i.ariaLabel}</span>
                  </>
                ) : (
                  i.label
                )}
              </Link>
            ))}
          </nav>
        </details>
      </div>
      <Link className="brand" id="brand" href={homePath(locale)} aria-label={dict.homeAria}>
        <Wordmark />
      </Link>
      <div className="header-right">
        <SearchBox locale={locale} labels={{ placeholder: dict.search.placeholder, open: dict.search.open }} />
        <LanguageSwitcher locale={locale} alternates={alternates} />
        <ThemeToggle label={dict.theme.toggle} />
      </div>
    </header>
  );
}
