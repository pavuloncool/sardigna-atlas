import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";
import { articlePath, entityPath, isEntityType } from "@/lib/i18n/segments";
import type { SanityImage } from "@/lib/sanity/image";
import { Tile } from "./Tile";

export type RelatedItem = {
  _id: string;
  _type: string;
  slug: string | null;
  title?: string | null;
  image?: SanityImage | null;
  category?: { key?: string; name?: string | null; slug?: string | null } | null;
};

/**
 * Blok „Polecane / Powiązane” (sekcja 5a), wspólny dla artykułu i encji.
 * Lista przychodzi z `relatedQuery` (najnowsze najpierw); gdy jest pusta, nic nie renderujemy.
 */
export function RelatedBlock({
  items,
  locale,
  heading,
}: {
  items: RelatedItem[] | null | undefined;
  locale: Locale;
  heading?: string;
}) {
  const list = (items ?? []).filter((i) => i.slug && i.title);
  if (list.length === 0) return null;
  const dict = getDictionary(locale);

  return (
    <section className="sec" aria-labelledby="related-h">
      <div className="sec-head">
        <h2 id="related-h">{heading ?? dict.article.related}</h2>
      </div>
      <ul className="tiles">
        {list.map((i) => {
          const href =
            i._type === "article"
              ? articlePath(locale, i.category?.slug ?? i.category?.key ?? "", i.slug!)
              : isEntityType(i._type)
                ? entityPath(locale, i._type, i.slug!)
                : null;
          if (!href) return null;
          return <Tile key={i._id} href={href} title={i.title!} sub={i.category?.name} image={i.image} />;
        })}
      </ul>
    </section>
  );
}
