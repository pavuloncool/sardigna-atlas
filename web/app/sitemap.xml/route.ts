import { siteUrl } from "@/lib/config";
import { DEFAULT_LOCALE, isLocale, locales, type Locale } from "@/lib/i18n/locales";
import { entityPath, homePath, pagePath, segment, type EntityType } from "@/lib/i18n/segments";
import { client } from "@/lib/sanity/client";
import { sitemapQuery } from "@/lib/sanity/queries";
import { categorySlug, getArticleRoutes, getCategories, STATIC_SECTIONS } from "@/lib/site";

export const dynamic = "force-static";

type Sitemap = {
  articles: { slug: string; language: string; _updatedAt: string; alternates?: { slug: string; language: string }[] }[];
  categories: { slugs: Record<string, string>; _updatedAt: string }[];
  places: { slug: string; _updatedAt: string }[];
  people: { slug: string; _updatedAt: string }[];
  products: { slug: string; _updatedAt: string }[];
  experiences: { slug: string; _updatedAt: string }[];
  hotels: { slug: string; _updatedAt: string }[];
  brands: { slug: string; _updatedAt: string }[];
  authors: { slug: string; _updatedAt: string }[];
};

type Entry = { loc: string; lastmod?: string; alternates?: Partial<Record<Locale, string>> };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** sitemap.xml generowany w buildzie z `sitemapQuery`; hreflang z wersji językowych (+ x-default). */
export async function GET() {
  const base = siteUrl();
  const data = await client.fetch<Sitemap>(sitemapQuery);
  const cats = await getCategories();
  const entries: Entry[] = [];

  const perLocale = (path: (l: Locale) => string, lastmod?: string) => {
    const alternates = Object.fromEntries(locales.map((l) => [l, path(l)])) as Partial<Record<Locale, string>>;
    for (const l of locales) entries.push({ loc: path(l), lastmod, alternates });
  };

  perLocale(homePath);
  for (const p of STATIC_SECTIONS) perLocale((l) => pagePath(l, p));
  for (const c of cats) perLocale((l) => `/${l}/${categorySlug(c, l)}/`);

  const entity = (type: EntityType, items: { slug: string; _updatedAt: string }[] | undefined) =>
    (items ?? []).forEach((i) => perLocale((l) => entityPath(l, type, i.slug), i._updatedAt));
  entity("place", data.places);
  entity("person", data.people);
  entity("product", data.products);
  entity("experience", data.experiences);
  entity("hotel", data.hotels);
  entity("brand", data.brands);
  for (const a of data.authors ?? []) perLocale((l) => `/${l}/${segment("authors", l)}/${a.slug}/`, a._updatedAt);

  // Artykuły: slug per język; alternatywy z `translation.metadata`.
  const articleCat = new Map((await getArticleRoutes()).map((r) => [`${r.language}:${r.slug}`, r.categoryKey]));
  for (const a of data.articles ?? []) {
    if (!isLocale(a.language)) continue;
    const cat = cats.find((c) => c.key === articleCat.get(`${a.language}:${a.slug}`));
    if (!cat) continue;
    const alternates: Partial<Record<Locale, string>> = {
      [a.language]: `/${a.language}/${categorySlug(cat, a.language)}/${a.slug}/`,
    };
    for (const t of a.alternates ?? []) {
      if (isLocale(t.language)) alternates[t.language] = `/${t.language}/${categorySlug(cat, t.language)}/${t.slug}/`;
    }
    entries.push({ loc: alternates[a.language]!, lastmod: a._updatedAt, alternates });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .map((e) => {
    const alts = Object.entries(e.alternates ?? {})
      .map(([l, p]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${esc(base + p)}"/>`)
      .concat(
        e.alternates?.[DEFAULT_LOCALE]
          ? [`    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(base + e.alternates[DEFAULT_LOCALE]!)}"/>`]
          : [],
      )
      .join("\n");
    return `  <url>\n    <loc>${esc(base + e.loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}${alts ? "\n" + alts : ""}\n  </url>`;
  })
  .join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

