import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import { articlePath } from "@/lib/i18n/segments";
import type { SanityImage } from "@/lib/sanity/image";
import { Figure } from "./Figure";

/** Kształt zwracany przez `articleCard` w queries.ts. */
export interface ArticleCardData {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  heroImage?: SanityImage | null;
  category?: { key?: string; name?: string | null; slug?: string | null } | null;
}

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
  const href = articlePath(locale, article.category?.slug ?? "", article.slug);
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
