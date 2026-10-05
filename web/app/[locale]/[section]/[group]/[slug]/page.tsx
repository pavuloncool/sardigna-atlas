import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { Feed } from "@/components/Feed";
import { Figure } from "@/components/Figure";
import { JsonLd } from "@/components/JsonLd";
import { OfferLink } from "@/components/OfferLink";
import { PageShell } from "@/components/PageShell";
import { RelatedBlock, type RelatedItem } from "@/components/RelatedBlock";
import { Tile } from "@/components/Tile";
import { RELATED_LIMIT } from "@/lib/config";
import { ENTITY_TYPES, resolveEntityType } from "@/lib/entities";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale, locales, type Locale } from "@/lib/i18n/locales";
import { entityPath, entitySegmentKey, pagePath, segment, type EntityType } from "@/lib/i18n/segments";
import { client } from "@/lib/sanity/client";
import { entityHubQuery, placeBySlugQuery, relatedQuery } from "@/lib/sanity/queries";
import type { EntityHubData, PlacePageData } from "@/lib/sanity/types";
import { ogImageUrl } from "@/lib/sanity/image";
import { breadcrumbLd, lodgingLd, organizationLd, personLd, placeLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";
import { allLocales, getEntityRoutes, resolveSection } from "@/lib/site";

export const dynamicParams = false;

/** Encje Atlasu: slug wspólny dla języków, więc ten sam zestaw tras w każdym języku. */
export async function generateStaticParams() {
  const routes = await getEntityRoutes();
  return locales.flatMap((locale) =>
    routes
      .filter((r) => (ENTITY_TYPES as string[]).includes(r._type))
      .map((r) => ({
        locale,
        section: segment("atlas", locale),
        group: segment(entitySegmentKey(r._type as EntityType), locale),
        slug: r.slug,
      })),
  );
}

type Loaded =
  | { type: "place"; place: PlacePageData }
  | { type: Exclude<EntityType, "place">; hub: EntityHubData };

async function load(locale: Locale, type: EntityType, slug: string): Promise<Loaded | null> {
  if (type === "place") {
    const place = await client.fetch<PlacePageData | null>(placeBySlugQuery, { lang: locale, slug, limit: 50 });
    return place ? { type, place } : null;
  }
  const hub = await client.fetch<EntityHubData | null>(entityHubQuery, { lang: locale, type, slug });
  return hub ? { type, hub } : null;
}

const labelOf = (l: Loaded) => (l.type === "place" ? l.place.name : l.hub.label);

export async function generateMetadata({ params }: PageProps<"/[locale]/[section]/[group]/[slug]">): Promise<Metadata> {
  const { locale, group, slug } = await params;
  if (!isLocale(locale)) return {};
  const type = resolveEntityType(locale, group);
  if (!type) return {};
  const data = await load(locale, type, slug);
  if (!data) return {};
  const summary = data.type === "place" ? data.place.summary : data.hub.summary;
  return pageMetadata({
    locale,
    title: labelOf(data) ?? undefined,
    description: summary,
    image: ogImageUrl(data.type === "place" ? data.place.cover : data.hub.image),
    path: entityPath(locale, type, slug),
    alternates: allLocales((l) => entityPath(l, type, slug)),
  });
}

export default async function EntityPage({ params }: PageProps<"/[locale]/[section]/[group]/[slug]">) {
  const { locale: l, section, group, slug } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  const resolved = await resolveSection(locale, section);
  const type = resolveEntityType(locale, group);
  if (!resolved || resolved.kind !== "static" || resolved.page !== "atlas" || !type) notFound();

  const data = await load(locale, type, slug);
  if (!data) notFound();
  const dict = getDictionary(locale);
  const id = data.type === "place" ? data.place._id : data.hub._id;

  let related = (await client.fetch<RelatedItem[] | null>(relatedQuery, { id, lang: locale, limit: RELATED_LIMIT })) ?? [];
  // Strona miejsca ma osobną sekcję artykułów, więc nie dublujemy ich w „Powiązanych”.
  if (data.type === "place") related = related.filter((x) => x._type !== "article");

  const title = labelOf(data);
  const atlasHref = pagePath(locale, "atlas");
  const hero = data.type === "place" ? data.place.cover : data.hub.image;
  const summary = data.type === "place" ? data.place.summary : data.hub.summary;
  const articles = (data.type === "place" ? data.place.articles : data.hub.articles) ?? [];

  const tiles = (
    heading: string,
    items: { _id: string; type: EntityType; slug: string | null; title: string | null; sub?: string | null; image?: ArticleImage; offer?: { affiliateUrl?: string | null; isSponsored?: boolean | null } }[],
  ) => {
    const list = items.filter((i) => i.slug && i.title);
    if (!list.length) return null;
    return (
      <section className="sec" aria-label={heading} data-pagefind-ignore>
        <div className="sec-head">
          <h2>{heading}</h2>
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

  const path = entityPath(locale, type, slug);
  const ogImg = ogImageUrl(hero);
  const ancestors = data.type === "place" ? (data.place.ancestors ?? []).map((a) => ({ name: a.name, path: entityPath(locale, "place", a.slug) })) : [];
  const ld =
    data.type === "place"
      ? placeLd({ path, name: title ?? "", description: summary, image: ogImg, coordinates: data.place.coordinates, ancestors })
      : data.type === "person"
        ? personLd({ locale, path, name: title ?? "", jobTitle: data.hub.role, description: summary, image: ogImg, sameAs: data.hub.sameAs })
        : data.type === "hotel"
          ? lodgingLd({ path, name: title ?? "", description: summary, image: ogImg, priceRange: data.hub.priceRange, coordinates: data.hub.coordinates, locality: data.hub.place?.name, website: data.hub.websiteUrl })
          : data.type === "brand"
            ? organizationLd({ path, name: title ?? "", description: summary, image: ogImg, website: data.hub.websiteUrl })
            : null;

  return (
    <PageShell locale={locale} alternates={allLocales((x) => entityPath(x, type, slug))}>
      {ld ? <JsonLd data={ld} /> : null}
      <JsonLd data={breadcrumbLd([{ name: "Sardigna Atlas", path: `/${locale}/` }, { name: dict.atlas.title, path: atlasHref }, ...ancestors.filter((a) => a.name).map((a) => ({ name: a.name!, path: a.path })), { name: title ?? "", path }])} />
      <header className="pg-head">
        <nav className="crumbs" aria-label="Atlas">
          <Link href={atlasHref}>{dict.atlas.title}</Link>
          {data.type === "place"
            ? (data.place.ancestors ?? []).map((a) => (
                <Link key={a.slug} href={entityPath(locale, "place", a.slug)}>
                  {a.name}
                </Link>
              ))
            : data.hub.place?.slug
              ? [
                  <Link key="p" href={entityPath(locale, "place", data.hub.place.slug)}>
                    {data.hub.place.name}
                  </Link>,
                ]
              : null}
        </nav>
        <h1>{title}</h1>
        {summary ? <p className="txt">{summary}</p> : null}
        {data.type !== "place" && data.hub.brand?.slug ? (
          <p className="meta">
            {dict.brandOf}: <Link href={entityPath(locale, "brand", data.hub.brand.slug)}>{data.hub.brand.name}</Link>
          </p>
        ) : null}
        {data.type === "brand" && data.hub.partnership && data.hub.partnership !== "none" ? (
          <p className="meta">{(dict.brandPartnership as Record<string, string>)[data.hub.partnership]}</p>
        ) : null}
        {data.type !== "place" ? (
          <p className="meta" style={{ marginTop: "1.2rem" }}>
            {data.hub.affiliateUrl ? <OfferLink locale={locale} url={data.hub.affiliateUrl} isSponsored={data.hub.isSponsored} /> : null}
            {data.hub.websiteUrl ? (
              <>
                {" "}
                <a href={data.hub.websiteUrl} rel="noopener" target="_blank">
                  {dict.entity.visit}
                </a>
              </>
            ) : null}
          </p>
        ) : null}
      </header>
      {hero ? (
        <div className="art-hero">
          <Figure image={hero} ratio={2.4} sizes="(min-width: 900px) 78vw, 100vw" priority />
        </div>
      ) : null}

      {data.type === "place" ? (
        <>
          {tiles(dict.sections.children, (data.place.children ?? []).map((c) => ({ _id: c._id, type: "place" as const, slug: c.slug, title: c.name, image: c.cover })))}
        </>
      ) : null}

      {data.type === "brand"
        ? tiles(dict.brandProducts, (data.hub.brandProducts ?? []).map((p) => ({ _id: p._id, type: "product" as const, slug: p.slug, title: p.name, offer: p })))
        : null}

      {articles.length ? (
        <section className="sec" aria-label={dict.sections.articles}>
          <div className="sec-head">
            <h2>{dict.sections.articles}</h2>
          </div>
          <Feed items={articles.map((a, i) => ({ key: a._id, node: <ArticleCard article={a} locale={locale} ratio={i % 2 ? 2.27 : 1.93} /> }))} />
        </section>
      ) : null}

      {data.type === "place" ? (
        <>
          {tiles(dict.sections.people, (data.place.people ?? []).map((p) => ({ _id: p._id, type: "person" as const, slug: p.slug, title: p.name, sub: p.role, image: p.portrait })))}
          {tiles(dict.sections.products, (data.place.products ?? []).map((p) => ({ _id: p._id, type: "product" as const, slug: p.slug, title: p.name, image: p.image, offer: p })))}
          {tiles(dict.sections.stays, (data.place.hotels ?? []).map((p) => ({ _id: p._id, type: "hotel" as const, slug: p.slug, title: p.name, image: p.image, offer: p })))}
          {tiles(dict.sections.experiences, (data.place.experiences ?? []).map((p) => ({ _id: p._id, type: "experience" as const, slug: p.slug, title: p.title, image: p.image, offer: p })))}
        </>
      ) : null}

      <RelatedBlock items={related} locale={locale} />
    </PageShell>
  );
}

type ArticleImage = import("@/lib/sanity/image").SanityImage | null | undefined;
