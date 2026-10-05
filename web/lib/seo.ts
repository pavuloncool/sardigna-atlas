import type { Metadata } from "next";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

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
}: {
  locale: Locale;
  title?: string;
  description?: string | null;
  path: string;
  alternates?: Partial<Record<Locale, string>>;
  noIndex?: boolean;
}): Metadata {
  const languages: Record<string, string> = { ...alternates };
  if (alternates?.[DEFAULT_LOCALE]) languages["x-default"] = alternates[DEFAULT_LOCALE]!;
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: path, ...(alternates ? { languages } : {}) },
    openGraph: { type: "website", locale, ...(title ? { title } : {}), ...(description ? { description } : {}) },
    ...(noIndex ? { robots: { index: false } } : {}),
  };
}
