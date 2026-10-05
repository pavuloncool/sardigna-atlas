import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/CategoryView";
import { Tile } from "@/components/Tile";
import dynamic from "next/dynamic";
import { MapSection, type MapPlace } from "@/components/MapSection";
import { PageShell } from "@/components/PageShell";
import { loadPage, type PageName } from "@/lib/content";
import { getDictionary, plural } from "@/lib/i18n/dictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { entityPath, pagePath, segment, type SegmentKey } from "@/lib/i18n/segments";
import { client } from "@/lib/sanity/client";
import { atlasIndexQuery, authorsIndexQuery, exploreMapQuery } from "@/lib/sanity/queries";
import type { AtlasIndexData, AuthorsIndexItem } from "@/lib/sanity/types";
import { ogImageUrl } from "@/lib/sanity/image";
import { pageMetadata } from "@/lib/seo";
import {
  allLocales,
  categoryName,
  categorySlug,
  localized,
  resolveSection,
  sectionParams,
  type StaticSection,
} from "@/lib/site";

// Formularz kontaktowy (Turnstile) jest osobną paczką JS, ładowaną tylko na stronie Kontakt.
const ContactForm = dynamic(() => import("@/components/ContactForm").then((m) => m.ContactForm));

export const dynamicParams = false;
export const generateStaticParams = sectionParams;

const PAGE_FILE: Record<Exclude<StaticSection, "atlas" | "authors">, PageName> = {
  about: "about",
  contact: "contact",
  privacy: "privacy-policy",
  cookies: "cookie-policy",
};

export async function generateMetadata({ params }: PageProps<"/[locale]/[section]">): Promise<Metadata> {
  const { locale, section } = await params;
  if (!isLocale(locale)) return {};
  const resolved = await resolveSection(locale, section);
  if (!resolved) return {};
  const path = `/${locale}/${section}/`;

  if (resolved.kind === "category") {
    const c = resolved.category;
    return pageMetadata({
      locale,
      title: categoryName(c, locale),
      description: localized(c.intro, locale) || undefined,
      image: ogImageUrl(c.cover),
      path,
      alternates: allLocales((l) => `/${l}/${categorySlug(c, l)}/`),
    });
  }
  const alternates = allLocales((l) => pagePath(l, resolved.page as SegmentKey));
  if (resolved.page === "atlas") {
    return pageMetadata({ locale, title: getDictionary(locale).atlas.title, path, alternates });
  }
  if (resolved.page === "authors") {
    return pageMetadata({ locale, title: getDictionary(locale).authors.title, path, alternates });
  }
  const page = loadPage(PAGE_FILE[resolved.page], locale);
  return pageMetadata({ locale, title: page.title, description: page.description, path, alternates });
}

export default async function SectionPage({ params }: PageProps<"/[locale]/[section]">) {
  const { locale: l, section } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  const resolved = await resolveSection(locale, section);
  if (!resolved) notFound();

  if (resolved.kind === "category") {
    const c = resolved.category;
    return (
      <PageShell locale={locale} alternates={allLocales((x) => `/${x}/${categorySlug(c, x)}/`)}>
        <CategoryView locale={locale} category={c} page={1} />
      </PageShell>
    );
  }

  const alternates = allLocales((x) => pagePath(x, resolved.page as SegmentKey));

  if (resolved.page === "atlas") return <AtlasPage locale={locale} alternates={alternates} />;
  if (resolved.page === "authors") return <AuthorsPage locale={locale} alternates={alternates} />;

  const page = loadPage(PAGE_FILE[resolved.page], locale);
  return (
    <PageShell locale={locale} alternates={alternates}>
      <header className="pg-head">
        <h1>{page.title}</h1>
      </header>
      <div className="prose page-prose" dangerouslySetInnerHTML={{ __html: page.html }} />
      {resolved.page === "contact" ? (
        <ContactForm
          locale={locale}
          dict={getDictionary(locale).contact}
          privacyHref={pagePath(locale, "privacy")}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
        />
      ) : null}
    </PageShell>
  );
}

async function AtlasPage({
  locale,
  alternates,
}: {
  locale: Locale;
  alternates: Partial<Record<Locale, string>>;
}) {
  const dict = getDictionary(locale);
  const [regions, idx] = await Promise.all([
    client.fetch<MapPlace[]>(exploreMapQuery, { lang: locale }),
    client.fetch<AtlasIndexData>(atlasIndexQuery, { lang: locale }),
  ]);

  const list = (
    title: string,
    items: { _id: string; label: string | null; sub?: string | null; href: string }[],
  ) =>
    items.length ? (
      <div>
        <h3 className="sec-sub">{title}</h3>
        <ul className="plain-list">
          {items.map((i) => (
            <li key={i._id}>
              <Link href={i.href}>{i.label}</Link>
              {i.sub ? <span> {i.sub}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <PageShell locale={locale} alternates={alternates}>
      <header className="pg-head">
        <h1>{dict.atlas.title}</h1>
        <p className="txt">{dict.atlas.intro}</p>
      </header>
      <div data-pagefind-ignore>
        <MapSection regions={regions ?? []} locale={locale} />
      </div>
      <section className="sec" aria-label={dict.atlas.title} data-pagefind-ignore>
        <div className="cols-3">
          {list(dict.sections.places, (idx?.places ?? []).map((p) => ({ _id: p._id, label: p.name, sub: p.parent?.name, href: entityPath(locale, "place", p.slug) })))}
          {list(dict.sections.people, (idx?.people ?? []).map((p) => ({ _id: p._id, label: p.name, sub: p.role, href: entityPath(locale, "person", p.slug) })))}
          {list(dict.sections.products, (idx?.products ?? []).map((p) => ({ _id: p._id, label: p.name, href: entityPath(locale, "product", p.slug) })))}
          {list(dict.sections.stays, (idx?.hotels ?? []).map((p) => ({ _id: p._id, label: p.name, href: entityPath(locale, "hotel", p.slug) })))}
          {list(dict.sections.experiences, (idx?.experiences ?? []).map((p) => ({ _id: p._id, label: p.title, href: entityPath(locale, "experience", p.slug) })))}
          {list(dict.sections.brands, (idx?.brands ?? []).map((p) => ({ _id: p._id, label: p.name, href: entityPath(locale, "brand", p.slug) })))}
        </div>
      </section>
    </PageShell>
  );
}

async function AuthorsPage({ locale, alternates }: { locale: Locale; alternates: Partial<Record<Locale, string>> }) {
  const dict = getDictionary(locale);
  const authors = (await client.fetch<AuthorsIndexItem[]>(authorsIndexQuery, { lang: locale })) ?? [];
  return (
    <PageShell locale={locale} alternates={alternates}>
      <header className="pg-head">
        <h1>{dict.authors.title}</h1>
        <p className="txt">{dict.authors.intro}</p>
      </header>
      <section className="sec" aria-label={dict.authors.title}>
        {authors.length ? (
          <ul className="tiles">
            {authors.map((a) => (
              <Tile
                key={a._id}
                href={`/${locale}/${segment("authors", locale)}/${a.slug}/`}
                title={a.name}
                sub={[a.kind === "guest" ? dict.authors.guest : null, a.role, a.articleCount ? plural(locale, a.articleCount, dict.authors.count) : null].filter(Boolean).join(" · ")}
                image={a.photo}
                ratio={1.2}
              />
            ))}
          </ul>
        ) : (
          <p className="txt">{dict.authors.empty}</p>
        )}
      </section>
    </PageShell>
  );
}
