import Link from "next/link";
import { BackToTop } from "./BackToTop";
import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";
import { homePath, pagePath } from "@/lib/i18n/segments";

export function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <footer className="site-footer" aria-label={dict.footer.aria}>
      <p className="big" aria-hidden="true">
        {dict.brand}
      </p>
      <nav className="footer-links" aria-label={dict.footer.aria}>
        <Link href={`${homePath(locale)}#opowiesci`}>{dict.nav.journal}</Link>
        <Link href={pagePath(locale, "atlas")}>{dict.nav.atlas}</Link>
        <Link href={pagePath(locale, "about")}>{dict.nav.about}</Link>
        <Link href={pagePath(locale, "contact")}>{dict.footer.contact}</Link>
        <Link href={pagePath(locale, "privacy")}>{dict.footer.privacy}</Link>
        <Link href={pagePath(locale, "cookies")}>{dict.footer.cookies}</Link>
        <BackToTop>{dict.footer.top}</BackToTop>
      </nav>
    </footer>
  );
}
