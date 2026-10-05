import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";
import { buildNav } from "@/lib/nav";
import { getCategories } from "@/lib/site";
import { Footer } from "./Footer";
import { Header } from "./Header";

/**
 * Header + treść + Footer. Każda strona renderuje własny shell, bo tylko ona zna
 * adresy tłumaczeń (`alternates`): przełącznik języka jest zwykłym linkiem i działa bez JS.
 */
export async function PageShell({
  locale,
  alternates,
  flush = false,
  footerNote,
  children,
}: {
  locale: Locale;
  alternates?: Partial<Record<Locale, string>>;
  /** Home: treść startuje od góry okna (hero pod stałym headerem). */
  flush?: boolean;
  /** Dyskretna linia pod linkami stopki (np. autor zdjęcia). */
  footerNote?: string;
  children: ReactNode;
}) {
  const dict = getDictionary(locale);
  const nav = buildNav(locale, dict, await getCategories());
  return (
    <>
      <a className="skip-link" href="#main">
        {dict.skipToContent}
      </a>
      <Header locale={locale} alternates={alternates} nav={nav} />
      <main id="main" className={flush ? undefined : "page"} data-pagefind-body>
        {children}
      </main>
      <Footer locale={locale} note={footerNote} />
    </>
  );
}
