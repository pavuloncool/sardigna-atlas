import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";
import { Footer } from "./Footer";
import { Header, type NavItem } from "./Header";

/**
 * Header + treść + Footer. Każda strona renderuje własny shell, bo tylko ona zna
 * adresy tłumaczeń (`alternates`) — dzięki temu przełącznik języka działa bez JS.
 */
export function PageShell({
  locale,
  alternates,
  nav,
  children,
}: {
  locale: Locale;
  alternates?: Partial<Record<Locale, string>>;
  nav?: NavItem[];
  children: ReactNode;
}) {
  const dict = getDictionary(locale);
  return (
    <>
      <a className="skip-link" href="#main">
        {dict.skipToContent}
      </a>
      <Header locale={locale} alternates={alternates} nav={nav} />
      <main id="main">{children}</main>
      <Footer locale={locale} />
    </>
  );
}
