import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";
import { paginationSlug } from "@/lib/i18n/segments";
import { client } from "@/lib/sanity/client";
import { categoryArticlesQuery } from "@/lib/sanity/queries";
import type { CategoryArticlesData } from "@/lib/sanity/types";
import { PAGE_SIZE } from "@/lib/config";
import { categoryName, categorySlug, localized, type Category } from "@/lib/site";
import { ArticleCard } from "./ArticleCard";
import { Feed } from "./Feed";
import { Pagination } from "./Pagination";

export async function fetchCategoryPage(locale: Locale, key: string, page: number) {
  const data = await client.fetch<CategoryArticlesData>(categoryArticlesQuery, {
    lang: locale,
    key,
    start: (page - 1) * PAGE_SIZE,
    end: page * PAGE_SIZE,
  });
  return { articles: data?.articles ?? [], total: data?.total ?? 0, pages: Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE)) };
}

/** Strona działu (lista artykułów z paginacją), wspólna dla strony 1 i kolejnych. */
export async function CategoryView({
  locale,
  category,
  page,
}: {
  locale: Locale;
  category: Category;
  page: number;
}) {
  const dict = getDictionary(locale);
  const { articles, pages } = await fetchCategoryPage(locale, category.key, page);
  const base = `/${locale}/${categorySlug(category, locale)}/`;
  const intro = localized(category.intro, locale);

  return (
    <>
      <header className="pg-head">
        <h1>{categoryName(category, locale)}</h1>
        {intro ? <p className="txt">{intro}</p> : null}
      </header>
      <section className="sec" aria-label={categoryName(category, locale)}>
        {articles.length ? (
          <Feed
            items={articles.map((a, i) => ({
              key: a._id,
              node: <ArticleCard article={a} locale={locale} ratio={i % 2 ? 2.27 : 1.93} />,
            }))}
          />
        ) : (
          <p className="txt">{dict.category.empty}</p>
        )}
      </section>
      <Pagination
        locale={locale}
        page={page}
        pages={pages}
        hrefFor={(n) => (n === 1 ? base : `${base}${paginationSlug(locale, n)}/`)}
      />
    </>
  );
}
