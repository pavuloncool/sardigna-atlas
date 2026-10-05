import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import { articlePath } from "@/lib/i18n/segments";
import type { ArticleCardData } from "@/lib/sanity/types";
import { Figure } from "./Figure";

export function ArticleCard({
  article,
  locale,
  ratio,
  fallback,
}: {
  article: ArticleCardData;
  locale: Locale;
  ratio?: number;
  fallback?: [string, string];
}) {
  const href = articlePath(locale, article.category?.slug ?? article.category?.key ?? "", article.slug);
  return (
    <article className="card">
      <Figure image={article.heroImage} ratio={ratio} fallback={fallback} caption={false} />
      <h3>
        <Link href={href}>{article.title}</Link>
        {article.category?.name ? <span>{article.category.name}</span> : null}
      </h3>
      {article.excerpt ? <p>{article.excerpt}</p> : null}
    </article>
  );
}
