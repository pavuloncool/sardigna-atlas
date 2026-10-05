import { siteUrl } from "@/lib/config";
import type { Locale } from "@/lib/i18n/locales";
import { homePath } from "@/lib/i18n/segments";

/**
 * Dane strukturalne schema.org (faza 5): WebSite/Organization, Article (+ Recipe dla
 * `format == "recipe"`), Person, Place, LodgingBusiness i BreadcrumbList.
 * Funkcje zwracają zwykłe obiekty; renderuje je `components/JsonLd.tsx`.
 */
const CONTEXT = "https://schema.org";
const abs = (path: string) => (/^https?:\/\//.test(path) ? path : siteUrl() + path);
const clean = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== "")) as T;

export const websiteLd = (locale: Locale) => ({
  "@context": CONTEXT,
  "@graph": [
    { "@type": "WebSite", "@id": abs("/#website"), name: "Sardigna Atlas", url: abs(homePath(locale)), inLanguage: locale },
    { "@type": "Organization", "@id": abs("/#org"), name: "Sardigna Atlas", url: abs("/") },
  ],
});

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@context": CONTEXT,
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
});

export function articleLd(a: {
  locale: Locale;
  path: string;
  title: string;
  description?: string | null;
  image?: string | null;
  author?: string | null;
  published?: string | null;
  modified?: string | null;
  section?: string | null;
  recipe?: boolean;
}) {
  const base = clean({
    name: a.title,
    headline: a.title,
    description: a.description,
    image: a.image,
    inLanguage: a.locale,
    datePublished: a.published,
    dateModified: a.modified,
    author: a.author ? { "@type": "Person", name: a.author } : { "@type": "Organization", name: "Sardigna Atlas" },
    publisher: { "@type": "Organization", name: "Sardigna Atlas", url: abs("/") },
    mainEntityOfPage: abs(a.path),
    url: abs(a.path),
  });
  const nodes: Record<string, unknown>[] = [{ "@type": "Article", articleSection: a.section, ...base }];
  // Recipe: schemat Sanity nie ma jeszcze składników ani kroków, więc węzeł zawiera tylko dane ogólne.
  if (a.recipe) nodes.push({ "@type": "Recipe", recipeCategory: a.section, ...base });
  return { "@context": CONTEXT, "@graph": nodes };
}

export function personLd(p: { locale: Locale; path: string; name: string; jobTitle?: string | null; description?: string | null; image?: string | null; sameAs?: string[] | null }) {
  return {
    "@context": CONTEXT,
    ...clean({ "@type": "Person", name: p.name, jobTitle: p.jobTitle, description: p.description, image: p.image, url: abs(p.path), sameAs: p.sameAs?.length ? p.sameAs : null }),
  };
}

export function placeLd(p: {
  path: string;
  name: string;
  description?: string | null;
  image?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  ancestors?: { name: string | null; path: string }[];
}) {
  const parent = p.ancestors?.[p.ancestors.length - 1];
  return {
    "@context": CONTEXT,
    ...clean({
      "@type": "Place",
      name: p.name,
      description: p.description,
      image: p.image,
      url: abs(p.path),
      geo: p.coordinates ? { "@type": "GeoCoordinates", latitude: p.coordinates.lat, longitude: p.coordinates.lng } : null,
      containedInPlace: parent?.name ? { "@type": "Place", name: parent.name, url: abs(parent.path) } : null,
    }),
  };
}

export function lodgingLd(h: {
  path: string;
  name: string;
  description?: string | null;
  image?: string | null;
  priceRange?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  locality?: string | null;
  website?: string | null;
}) {
  return {
    "@context": CONTEXT,
    ...clean({
      "@type": "LodgingBusiness",
      name: h.name,
      description: h.description,
      image: h.image,
      url: abs(h.path),
      priceRange: h.priceRange,
      sameAs: h.website ? [h.website] : null,
      geo: h.coordinates ? { "@type": "GeoCoordinates", latitude: h.coordinates.lat, longitude: h.coordinates.lng } : null,
      address: h.locality ? { "@type": "PostalAddress", addressLocality: h.locality, addressCountry: "IT" } : { "@type": "PostalAddress", addressCountry: "IT" },
    }),
  };
}

export function organizationLd(o: { path: string; name: string; description?: string | null; image?: string | null; website?: string | null }) {
  return {
    "@context": CONTEXT,
    ...clean({ "@type": "Organization", name: o.name, description: o.description, logo: o.image, image: o.image, url: abs(o.path), sameAs: o.website ? [o.website] : null }),
  };
}
