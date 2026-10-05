import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { Feed } from "@/components/Feed";
import { JsonLd } from "@/components/JsonLd";
import { Figure } from "@/components/Figure";
import { Hero, type HeroColumn } from "@/components/Hero";
import { MapSection } from "@/components/MapSection";
import { PageShell } from "@/components/PageShell";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale, locales, type Locale } from "@/lib/i18n/locales";
import { articlePath, homePath, pagePath, type SegmentKey } from "@/lib/i18n/segments";
import { websiteLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";
import { HERO_IMAGE, HERO_IMAGE_ENABLED } from "@/lib/config";
import { client } from "@/lib/sanity/client";
import { homeQuery } from "@/lib/sanity/queries";
import { categoryName, categoryPath, getCategories } from "@/lib/site";
import type { HomeData } from "@/lib/sanity/types";
import homeEn from "@/content/home.en.json";
import homePl from "@/content/home.pl.json";

type Target = { segment: string } | { category: string };
type HomeContent = Omit<typeof homePl, "columns"> & {
  columns: { word: string; text: string; links: { label: string; to: Target }[] }[];
};

// Treść trzech kolumn w repo (migracja do Sanity w wersji 2). Brakujący język → polski.
const content: Partial<Record<Locale, HomeContent>> = { pl: homePl as HomeContent, en: homeEn as HomeContent };

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({
    locale,
    path: homePath(locale),
    alternates: Object.fromEntries(locales.map((l) => [l, homePath(l)])),
  });
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const home = content[locale] ?? homePl;
  const [cats, data] = await Promise.all([
    getCategories(),
    client.fetch<HomeData>(homeQuery, { lang: locale }),
  ]);

  const columns: HeroColumn[] = home.columns.map((c) => ({
    word: c.word,
    text: c.text,
    links: c.links.map((l) => ({
      label: l.label,
      href: "segment" in l.to ? pagePath(locale, l.to.segment as SegmentKey) : categoryPath(cats, l.to.category, locale),
    })),
  }));

  // Wyróżniony artykuł otwiera Opowieści (jak lewa karta w prototypie), reszta wg daty.
  const featured = data?.featured;
  const latest = [
    ...(featured ? [featured] : []),
    ...(data?.latest ?? []).filter((a) => a._id !== featured?._id),
  ];
  const catSlug = (a: { category?: { slug: string | null; key: string } | null }) => a.category?.slug ?? a.category?.key ?? "";
  // Panorama (2,4:1): zdjęcie następnego artykułu; gdy nie ma więcej artykułów, okładka pierwszego działu z treścią.
  const next = latest[2];
  const firstCat = cats.find((c) => data?.categories?.some((g) => g.key === c.key && g.articles?.length));
  const wide = next
    ? { href: articlePath(locale, catSlug(next), next.slug), label: next.title, image: next.heroImage }
    : firstCat
      ? { href: categoryPath(cats, firstCat.key, locale), label: categoryName(firstCat, locale), image: firstCat.cover }
      : null;
  const card = (a: (typeof latest)[number], ratio?: number) => ({
    key: a._id,
    node: <ArticleCard article={a} locale={locale} ratio={ratio} />,
  });

  return (
    <PageShell
      locale={locale}
      flush
      alternates={Object.fromEntries(locales.map((l) => [l, homePath(l)]))}
      footerNote={HERO_IMAGE_ENABLED ? `${dict.footer.photo}: ${HERO_IMAGE.credit}` : undefined}
    >
      <JsonLd data={websiteLd(locale)} />
      <h1 className="sr">{dict.brand}</h1>
      <Hero columns={columns} image={HERO_IMAGE_ENABLED ? HERO_IMAGE : null} />

      {latest.length > 0 ? (
        <section className="voices" id="opowiesci" aria-label={home.voicesAria} data-pagefind-ignore>
          {latest.slice(0, 2).map((a, i) => card(a, i === 0 ? 1.93 : 2.27).node)}
        </section>
      ) : (
        <span id="opowiesci" />
      )}

      {wide ? (
        <div className="wide" data-pagefind-ignore>
          <Link href={wide.href} aria-label={wide.label}>
            <Figure image={wide.image} ratio={2.4} sizes="(min-width: 900px) 78vw, 100vw" caption={false} fallback={["var(--granit)", "var(--piasek)"]} />
          </Link>
        </div>
      ) : null}

      {latest.length > 3 ? (
        <Feed className="voices" items={latest.slice(3).map((a, i) => card(a, i % 2 ? 2.27 : 1.93))} />
      ) : null}

      {cats.map((c) => {
        const group = data?.categories?.find((x) => x.key === c.key);
        if (!group?.articles?.length) return null;
        const href = categoryPath(cats, c.key, locale);
        return (
          <section className="sec" key={c.key} aria-labelledby={`cat-${c.key}`} data-pagefind-ignore>
            <div className="sec-head">
              <h2 id={`cat-${c.key}`}>
                <Link href={href}>{categoryName(c, locale)}</Link>
              </h2>
              <Link href={href}>{dict.home.readMore}</Link>
            </div>
            <Feed items={group.articles.map((a, i) => card(a, i % 2 ? 2.27 : 1.93))} />
          </section>
        );
      })}

      <section className="sec" aria-labelledby="explore-h" data-pagefind-ignore>
        <div className="sec-head">
          <h2 id="explore-h">
            <Link href={pagePath(locale, "atlas")}>{dict.atlas.title}</Link>
          </h2>
        </div>
      </section>
      <div data-pagefind-ignore>
        <MapSection regions={data?.regions ?? []} locale={locale} />
      </div>
    </PageShell>
  );
}
