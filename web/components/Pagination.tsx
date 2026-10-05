import Link from "@/components/Link";
import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";

/** Paginacja działu: strona 1 = adres działu, kolejne = `strona-N` (PL) / `page-N` (EN). */
export function Pagination({
  locale,
  page,
  pages,
  hrefFor,
}: {
  locale: Locale;
  page: number;
  pages: number;
  hrefFor: (page: number) => string;
}) {
  if (pages <= 1) return null;
  const dict = getDictionary(locale);
  return (
    <nav className="pager" aria-label={dict.pager.aria}>
      {page > 1 ? <Link href={hrefFor(page - 1)} rel="prev">{dict.pager.prev}</Link> : <span />}
      <span>
        {page} / {pages}
      </span>
      {page < pages ? <Link href={hrefFor(page + 1)} rel="next">{dict.pager.next}</Link> : <span />}
    </nav>
  );
}
