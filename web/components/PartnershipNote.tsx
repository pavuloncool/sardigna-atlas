import Link from "@/components/Link";
import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";
import { entityPath, segment } from "@/lib/i18n/segments";
import { effectiveType } from "@/lib/partnership";
import type { Partnership } from "@/lib/sanity/types";

/**
 * Oznaczenie współpracy na początku artykułu (sekcje 12 i 14 briefu): afiliacja wykrywana
 * automatycznie z `affiliateUrl`, sponsoring/współpraca/barter z pola `partnership` artykułu.
 * Teksty wymagają przeglądu prawnika (docs/PARTNERSHIPS.md).
 */
export function PartnershipNote({
  locale,
  partnership,
  hasAffiliate,
}: {
  locale: Locale;
  partnership?: Partnership | null;
  hasAffiliate: boolean;
}) {
  const type = effectiveType(partnership, hasAffiliate);
  if (type === "none") return null;
  const dict = getDictionary(locale);
  const t = dict.partnership.text;

  const partners = (partnership?.partners ?? []).filter((p) => p.name);
  const names = partners.map((p, i) => {
    const href = !p.slug ? null : p._type === "brand" ? entityPath(locale, "brand", p.slug) : `/${locale}/${segment("authors", locale)}/${p.slug}/`;
    return (
      <span key={`${p.name}-${i}`}>
        {i ? ", " : ""}
        {href ? <Link href={href}>{p.name}</Link> : p.name}
      </span>
    );
  });

  // Tekst z szablonem `{partners}` rozbijamy, żeby wstawić linki do partnerów.
  const withPartners = (named: string, anon: string) => {
    if (!names.length) return anon;
    const [before, after] = named.split("{partners}");
    return (
      <>
        {before}
        {names}
        {after}
      </>
    );
  };
  const body =
    type === "sponsored"
      ? withPartners(t.sponsored, t.sponsoredAnon)
      : type === "collaboration"
        ? withPartners(t.collaboration, t.collaborationAnon)
        : type === "gifted"
          ? withPartners(t.gifted, t.giftedAnon)
          : t.affiliate;

  return (
    <div className="art-note" data-pagefind-ignore>
      <p className="affiliate-note" role="note">
        <strong>{dict.partnership.label[type]}.</strong> {body}
        {partnership?.note && type !== "affiliate" ? ` ${partnership.note}` : null}
        {hasAffiliate && type !== "affiliate" ? ` ${t.affiliate}` : null}
      </p>
    </div>
  );
}
