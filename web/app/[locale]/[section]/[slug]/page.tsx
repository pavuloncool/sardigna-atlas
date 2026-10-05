import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { AuthorView, fetchAuthor } from "@/components/AuthorView";
import { CategoryView, fetchCategoryPage } from "@/components/CategoryView";
import { Figure } from "@/components/Figure";
import { JsonLd } from "@/components/JsonLd";
import { OfferLink } from "@/components/OfferLink";
import { PageShell } from "@/components/PageShell";
import { PartnershipNote, effectiveType } from "@/components/PartnershipNote";
import { Prose } from "@/components/Prose";
import { RelatedBlock, type RelatedItem } from "@/components/RelatedBlock";
import { Tile } from "@/components/Tile";
import { RELATED_LIMIT } from "@/lib/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale, locales, type Locale } from "@/lib/i18n/locales";
import { entityPath, paginationSlug, parsePaginationSlug, segment } from "@/lib/i18n/segments";
import { client } from "@/lib/sanity/client";
import { articleBySlugQuery, authorRoutesQuery, relatedQuery } from "@/lib/sanity/queries";
import type { ArticlePageData } from "@/lib/sanity/types";
import { ogImageUrl } from "@/lib/sanity/image";
import { articleLd, breadcrumbLd, personLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";
import { allLocales } from "@/lib/site";
import {
  articleAlternates,
  categoryName,
  categorySlug,
  getArticleRoutes,
  getCategories,
  resolveSection,
} from "@/lib/site";

export const dynamicParams = false;

/** Artykuły (`/{język}/{dział}/{slug}/`) oraz kolejne strony działów (`/{dział}/strona-N/`). */
export async function generateStaticParams() {
  const cats = await getCategories();
  const articles = (await getArticleRoutes()).flatMap((a) => {
    const cat = cats.find((c) => c.key === a.categoryKey);
    return cat && (locales as string[]).includes(a.language)
      ? [{ locale: a.language, section: categorySlug(cat, a.language), slug: a.slug }]
      : [];
  });
  const pages = (
    await Promise.all(
      locales.flatMap((locale) =>
        cats.map(async (c) => {
          const { pages } = await fetchCategoryPage(locale, c.key, 1);
          return Array.from({ length: pages - 1 }, (_, i) => ({
            locale,
            section: categorySlug(c, locale),
            slug: paginationSlug(locale, i + 2),
          }));
        }),
      ),
    )
  ).flat();
  const authors = (await client.fetch<{ slug: string }[]>(authorRoutesQuery)) ?? [];
  const authorParams = locales.flatMap((locale) => authors.map((a) => ({ locale, section: segment("authors", locale), slug: a.slug })));
  return [...articles, ...pages, ...authorParams];
}

const dateFmt = (locale: Locale, iso: string | null) =>
  iso ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(iso)) : null;

async function loadArticle(locale: Locale, slug: string) {
  return client.fetch<ArticlePageData | null>(articleBySlugQuery, { lang: locale, slug });
}

export async function generateMetadata({ params }: PageProps<"/[locale]/[section]/[slug]">): Promise<Metadata> {
  const { locale, section, slug } = await params;
  if (!isLocale(locale)) return {};
  const resolvedSection = await resolveSection(locale, section);
  if (resolvedSection?.kind === "static" && resolvedSection.page === "authors") {
    const author = await fetchAuthor(locale, slug);
    if (!author) return {};
    return pageMetadata({
      locale,
      title: author.name,
      description: author.bio,
      image: ogImageUrl(author.photo),
      path: `/${locale}/${section}/${slug}/`,
      alternates: allLocales((l) => `/${l}/${segment("authors", l)}/${slug}/`),
    });
  }
  const cat = resolvedSection as { kind: string; category: Awaited<ReturnType<typeof getCategories>>[number] } | null;
  if (!cat || cat.kind !== "category") return {};
  const page = parsePaginationSlug(locale, slug);
  if (page) {
    return pageMetadata({
      locale,
      title: `${categoryName(cat.category, locale)} · ${page}`,
      path: `/${locale}/${section}/${slug}/`,
    });
  }
  const a = await loadArticle(locale, slug);
  if (!a) return {};
  const cats = await getCategories();
  return pageMetadata({
    locale,
    title: a.seo?.title ?? a.title,
    description: a.seo?.description ?? a.excerpt,
    image: ogImageUrl(a.seo?.ogImage ?? a.heroImage),
    path: `/${locale}/${section}/${slug}/`,
    alternates: { [locale]: `/${locale}/${section}/${slug}/`, ...articleAlternates(cats, a.category?.key, a.translations) },
    noIndex: a.seo?.noIndex ?? false,
  });
}

export default async function ArticleOrPage({ params }: PageProps<"/[locale]/[section]/[slug]">) {
  const { locale: l, section, slug } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  const resolved = await resolveSection(locale, section);
  if (resolved?.kind === "static" && resolved.page === "authors") {
    const author = await fetchAuthor(locale, slug);
    if (!author) notFound();
    const path = `/${locale}/${section}/${slug}/`;
    return (
      <PageShell locale={locale} alternates={allLocales((l) => `/${l}/${segment("authors", l)}/${slug}/`)}>
        <JsonLd
          data={[
            personLd({ locale, path, name: author.name, jobTitle: author.role, description: author.bio, image: ogImageUrl(author.photo), sameAs: [author.website, ...(author.links ?? []).map((l) => l.url)].filter((u): u is string => Boolean(u)) }),
            breadcrumbLd([
              { name: "Sardigna Atlas", path: `/${locale}/` },
              { name: getDictionary(locale).authors.title, path: `/${locale}/${section}/` },
              { name: author.name, path },
            ]),
          ]}
        />
        <AuthorView locale={locale} author={author} />
      </PageShell>
    );
  }
  if (!resolved || resolved.kind !== "category") notFound();

  const cats = await getCategories();
  const pageNo = parsePaginationSlug(locale, slug);
  if (pageNo) {
    const { pages } = await fetchCategoryPage(locale, resolved.category.key, pageNo);
    if (pageNo > pages) notFound();
    return (
      <PageShell
        locale={locale}
        alternates={Object.fromEntries(locales.map((x) => [x, `/${x}/${categorySlug(resolved.category, x)}/${paginationSlug(x, pageNo)}/`]))}
      >
        <CategoryView locale={locale} category={resolved.category} page={pageNo} />
      </PageShell>
    );
  }

  const a = await loadArticle(locale, slug);
  if (!a) notFound();
  const dict = getDictionary(locale);
  const alternates = { [locale]: `/${locale}/${section}/${slug}/`, ...articleAlternates(cats, a.category?.key, a.translations) };

  const auto = (await client.fetch<RelatedItem[] | null>(relatedQuery, { id: a._id, lang: locale, limit: RELATED_LIMIT })) ?? [];
  const toItem = (x: NonNullable<ArticlePageData["related"]>[number]): RelatedItem => ({
    _id: x._id, _type: "article", slug: x.slug, title: x.title, image: x.heroImage, category: x.category,
  });
  const seen = new Set<string>();
  const related = [...(a.related ?? []).map(toItem), ...auto]
    .filter((x) => x._id !== a._id && !seen.has(x._id) && seen.add(x._id))
    .slice(0, RELATED_LIMIT);
  const similar = (a.similar ?? []).map(toItem).filter((x) => !seen.has(x._id));

  const offers = [...(a.hotel ?? []), ...(a.experiences ?? []), ...(a.products ?? [])];
  const hasAffiliate = offers.some((o) => o.affiliateUrl);
  const catHref = `/${locale}/${section}/`;
  const published = dateFmt(locale, a.publishedAt);

  const tiles = (
    title: string,
    items: { _id: string; type: "place" | "person" | "product" | "hotel" | "experience"; slug: string | null; title: string | null; sub?: string | null; image?: ArticlePageData["heroImage"]; offer?: { affiliateUrl?: string | null; isSponsored?: boolean | null } }[],
  ) => {
    const list = items.filter((i) => i.slug && i.title);
    if (!list.length) return null;
    return (
      <section className="sec" aria-label={title} data-pagefind-ignore>
        <div className="sec-head">
          <h2>{title}</h2>
        </div>
        <ul className="tiles">
          {list.map((i) => (
            <Tile key={i._id} href={entityPath(locale, i.type, i.slug!)} title={i.title!} sub={i.sub} image={i.image}>
              {i.offer?.affiliateUrl ? <OfferLink locale={locale} url={i.offer.affiliateUrl} isSponsored={i.offer.isSponsored} /> : null}
            </Tile>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <PageShell locale={locale} alternates={alternates}>
      <JsonLd
        data={[
          articleLd({
            locale,
            path: `/${locale}/${section}/${slug}/`,
            title: a.title,
            description: a.seo?.description ?? a.excerpt,
            image: ogImageUrl(a.seo?.ogImage ?? a.heroImage),
            author: a.author?.name,
            sponsors: effectiveType(a.partnership, false) === "sponsored" ? (a.partnership?.partners ?? []).map((x) => x.name) : [],
            published: a.publishedAt,
            modified: a._updatedAt,
            section: a.category?.name,
            recipe: a.format === "recipe",
          }),
          breadcrumbLd([
            { name: "Sardigna Atlas", path: `/${locale}/` },
            ...(a.category?.name ? [{ name: a.category.name, path: catHref }] : []),
            { name: a.title, path: `/${locale}/${section}/${slug}/` },
          ]),
        ]}
      />
      <article>
        <header className="art-head">
          <p className="meta">
            <Link href={catHref}>{a.category?.name}</Link>
            {published ? <> · {published}</> : null}
            {a.author?.name ? (
              <>
                {" · "}
                {a.author.slug ? <Link href={`/${locale}/${segment("authors", locale)}/${a.author.slug}/`}>{a.author.name}</Link> : a.author.name}
              </>
            ) : null}
          </p>
          <h1>{a.title}</h1>
          {a.excerpt ? <p className="txt">{a.excerpt}</p> : null}
        </header>
        <PartnershipNote locale={locale} partnership={a.partnership} hasAffiliate={hasAffiliate} />
        <div className="art-hero">
          <Figure image={a.heroImage} ratio={2.4} sizes="(min-width: 900px) 78vw, 100vw" priority fallback={["var(--granit)", "var(--piasek)"]} />
        </div>
        <div className="art-body">
          {a.body ? <Prose value={a.body} locale={locale} /> : null}
        </div>
      </article>

      {a.gallery?.length ? (
        <section className="sec" aria-label="Galeria">
          <ul className="tiles">
            {a.gallery.map((g, i) => (
              <li className="tile" key={i}>
                <Figure image={g} ratio={1.5} sizes="(min-width: 900px) 22vw, 60vw" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tiles(dict.sections.places, (a.location ?? []).map((p) => ({ _id: p._id, type: "place" as const, slug: p.slug, title: p.name, sub: p.parent?.name, image: p.image })))}
      {tiles(dict.sections.people, (a.people ?? []).map((p) => ({ _id: p._id, type: "person" as const, slug: p.slug, title: p.name, sub: p.role, image: p.portrait })))}
      {tiles(dict.sections.products, (a.products ?? []).filter((p) => p.kind !== "equipment").map((p) => ({ _id: p._id, type: "product" as const, slug: p.slug, title: p.name, sub: p.brand?.name, image: p.image, offer: p })))}
      {tiles(dict.sections.equipment, (a.products ?? []).filter((p) => p.kind === "equipment").map((p) => ({ _id: p._id, type: "product" as const, slug: p.slug, title: p.name, sub: p.brand?.name, image: p.image, offer: p })))}
      {tiles(dict.sections.stays, (a.hotel ?? []).map((p) => ({ _id: p._id, type: "hotel" as const, slug: p.slug, title: p.name, sub: p.place?.name, image: p.image, offer: p })))}
      {tiles(dict.sections.experiences, (a.experiences ?? []).map((p) => ({ _id: p._id, type: "experience" as const, slug: p.slug, title: p.title, sub: p.place?.name, image: p.image, offer: p })))}

      {a.author?.slug ? (
        <section className="sec" aria-label={dict.authors.about} data-pagefind-ignore>
          <div className="sec-head">
            <h2>{dict.authors.about}</h2>
          </div>
          <ul className="tiles">
            <Tile href={`/${locale}/${segment("authors", locale)}/${a.author.slug}/`} title={a.author.name} sub={[a.author.kind === "guest" ? dict.authors.guest : null, a.author.role].filter(Boolean).join(" · ")} image={a.author.photo} ratio={1.2}>
              {a.author.bio ? <p className="sub">{a.author.bio}</p> : null}
              {a.author.disclosure ? <p className="sub">{dict.authors.disclosureLabel}: {a.author.disclosure}</p> : null}
            </Tile>
          </ul>
        </section>
      ) : null}

      <RelatedBlock items={related} locale={locale} />
      <RelatedBlock items={similar} locale={locale} heading={dict.article.similar} />
    </PageShell>
  );
}
