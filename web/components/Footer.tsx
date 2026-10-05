import Link from "@/components/Link";
import { BackToTop } from "./BackToTop";
import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";
import { homePath, pagePath } from "@/lib/i18n/segments";

export function Footer({ locale, note }: { locale: Locale; note?: string }) {
  const dict = getDictionary(locale);
  return (
    <footer className="site-footer" aria-label={dict.footer.aria}>
      <p className="big" aria-hidden="true">
        {dict.brand}
      </p>
      <nav className="footer-links" aria-label={dict.footer.aria}>
        <Link href={`${homePath(locale)}#opowiesci`}>{dict.nav.journal}</Link>
        <Link href={pagePath(locale, "atlas")}>{dict.nav.atlas}</Link>
        <Link href={pagePath(locale, "authors")}>{dict.footer.authors}</Link>
        <Link href={pagePath(locale, "about")}>{dict.nav.about}</Link>
        <Link href={pagePath(locale, "contact")}>{dict.footer.contact}</Link>
        <Link href={pagePath(locale, "privacy")}>{dict.footer.privacy}</Link>
        <Link href={pagePath(locale, "cookies")}>{dict.footer.cookies}</Link>
        <BackToTop>{dict.footer.top}</BackToTop>
      </nav>
      {note ? <p className="footer-note">{note}</p> : null}
    </footer>
  );
}
