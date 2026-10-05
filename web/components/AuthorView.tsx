import type { ReactNode } from "react";
import Link from "@/components/Link";
import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";
import { pagePath } from "@/lib/i18n/segments";
import { client } from "@/lib/sanity/client";
import { authorBySlugQuery } from "@/lib/sanity/queries";
import type { AuthorPageData } from "@/lib/sanity/types";
import { ArticleCard } from "./ArticleCard";
import { Feed } from "./Feed";
import { Figure } from "./Figure";

export const fetchAuthor = (locale: Locale, slug: string) =>
  client.fetch<AuthorPageData | null>(authorBySlugQuery, { lang: locale, slug });

/** Profil autora (redakcja albo autor gościnny/twórca): bio, linki, informacja o współpracach, artykuły. */
export function AuthorView({ locale, author }: { locale: Locale; author: AuthorPageData }): ReactNode {
  const dict = getDictionary(locale);
  const articles = author.articles ?? [];
  const links = (author.links ?? []).filter((l) => l.url);

  return (
    <>
      <header className="pg-head">
        <nav className="crumbs" aria-label={dict.authors.title}>
          <Link href={pagePath(locale, "authors")}>{dict.authors.title}</Link>
        </nav>
        <p className="meta">{[author.kind === "guest" ? dict.authors.guest : null, author.role].filter(Boolean).join(" · ")}</p>
        <h1>{author.name}</h1>
        {author.bio ? <p className="txt">{author.bio}</p> : null}
        {author.website || links.length ? (
          <p className="meta" style={{ marginTop: "1.2rem" }}>
            {author.website ? (
              <a href={author.website} rel="noopener" target="_blank">
                {dict.authors.website}
              </a>
            ) : null}
            {links.map((l) => (
              <span key={l.url}>
                {" "}
                <a href={l.url!} rel="noopener" target="_blank">
                  {l.label ?? l.url}
                </a>
              </span>
            ))}
          </p>
        ) : null}
      </header>

      {author.photo ? (
        <div className="art-hero">
          <Figure image={author.photo} ratio={2.4} sizes="(min-width: 900px) 78vw, 100vw" priority />
        </div>
      ) : null}

      {author.disclosure ? (
        <div className="art-body" data-pagefind-ignore>
          <p className="affiliate-note">
            <strong>{dict.authors.disclosureLabel}:</strong> {author.disclosure}
          </p>
        </div>
      ) : null}

      {articles.length ? (
        <section className="sec" aria-label={dict.authors.articles}>
          <div className="sec-head">
            <h2>{dict.authors.articles}</h2>
          </div>
          <Feed items={articles.map((a, i) => ({ key: a._id, node: <ArticleCard article={a} locale={locale} ratio={i % 2 ? 2.27 : 1.93} /> }))} />
        </section>
      ) : null}
    </>
  );
}
