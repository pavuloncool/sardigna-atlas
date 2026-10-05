import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";

/**
 * Link afiliacyjny (sekcja 12): zwykły link, `rel="sponsored noopener"`, `target="_blank"`
 * i widoczna etykieta. Bez widgetów i iframe'ów partnerów.
 */
export function OfferLink({
  locale,
  url,
  isSponsored,
}: {
  locale: Locale;
  url: string;
  isSponsored?: boolean | null;
}) {
  const dict = getDictionary(locale);
  return (
    <>
      <a className="aff" href={url} rel="sponsored noopener" target="_blank">
        {dict.entity.offer}
      </a>
      <span className="tag">
        ({dict.entity.affiliate}
        {isSponsored ? `, ${dict.entity.sponsored}` : ""})
      </span>
    </>
  );
}
