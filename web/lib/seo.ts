import type { Metadata } from "next";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

/** Domyślny obraz OG (public/og/default.jpg: kadr 1200×630 ze zdjęcia hero). */
export const DEFAULT_OG_IMAGE = "/og/default.jpg";

/**
 * Canonical + hreflang (z `x-default` na język domyślny). `alternates` to ścieżki wszystkich
 * wersji językowych strony, łącznie z bieżącą. Adresy względne rozwiązuje `metadataBase`.
 */
export function pageMetadata({
  locale,
  title,
  description,
  path,
  alternates,
  noIndex,
  image,
}: {
  locale: Locale;
  title?: string;
  description?: string | null;
  path: string;
  alternates?: Partial<Record<Locale, string>>;
  noIndex?: boolean;
  /** Adres obrazu OG (1200×630): absolutny (Sanity) albo względny względem `metadataBase`. */
  image?: string | null;
}): Metadata {
  const og = image ?? DEFAULT_OG_IMAGE;
  const languages: Record<string, string> = { ...alternates };
  if (alternates?.[DEFAULT_LOCALE]) languages["x-default"] = alternates[DEFAULT_LOCALE]!;
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: path, ...(alternates ? { languages } : {}) },
    openGraph: {
      type: "website",
      siteName: "Sardigna Atlas",
      locale,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      images: [{ url: og, width: 1200, height: 630, alt: title ?? "Sardigna Atlas" }],
    },
    twitter: { card: "summary_large_image", images: [og] },
    ...(noIndex ? { robots: { index: false } } : {}),
  };
}
