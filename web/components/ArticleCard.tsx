import Link from "@/components/Link";
import type { Locale } from "@/lib/i18n/locales";
import { articlePath, categoryHref } from "@/lib/i18n/segments";
import type { ArticleCardData } from "@/lib/sanity/types";
import { Figure } from "./Figure";

export function ArticleCard({
  article,
  locale,
  ratio,
  fallback,
  showCategory = false,
}: {
  article: ArticleCardData;
  locale: Locale;
  ratio?: number;
  fallback?: [string, string];
  /** Klikalny link do działu nad obrazem; tylko tam, gdzie kontekst nie podaje działu (np. blok „najnowsze”). */
  showCategory?: boolean;
}) {
  const catSlug = article.category?.slug ?? article.category?.key ?? "";
  const href = articlePath(locale, catSlug, article.slug);
  return (
    <article className="card">
      {showCategory && article.category?.name ? (
        <p className="card-cat">
          <Link href={categoryHref(locale, catSlug)}>{article.category.name}</Link>
        </p>
      ) : null}
      <Figure image={article.heroImage} ratio={ratio} fallback={fallback} caption={false} decorative />
      <h3>
        <Link href={href}>{article.title}</Link>
      </h3>
      {article.excerpt ? <p>{article.excerpt}</p> : null}
    </article>
  );
}
