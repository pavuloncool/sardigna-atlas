/** Co ile kart w feedzie wstawiamy slot In-Feed (sekcja 13 briefu). */
export const AD_EVERY = 6;
/** Flaga reklam: w wersji 1.0 zawsze `false` (slot jest pusty i ukryty). */
export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
/** Artykułów na stronę działu. */
export const PAGE_SIZE = 12;
/** Pozycji w bloku „Polecane / Powiązane”. */
export const RELATED_LIMIT = 6;

export const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
