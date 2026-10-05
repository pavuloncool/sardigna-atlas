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

/**
 * Zdjęcie w tle hero (docs/DECISIONS.md: świadome odstępstwo od prototypu). Wyłączenie:
 * `NEXT_PUBLIC_HERO_IMAGE=false` (zmienna Pages + rebuild) przywraca białe hero z prototypu.
 */
export const HERO_IMAGE_ENABLED = process.env.NEXT_PUBLIC_HERO_IMAGE !== "false";

export const HERO_IMAGE = {
  src: "/hero/sardigna-hero.jpg",
  srcSet: "/hero/sardigna-hero-768.jpg 768w, /hero/sardigna-hero-1280.jpg 1280w, /hero/sardigna-hero.jpg 1920w",
  width: 1920,
  height: 1440,
  credit: "Christopher Politano / Unsplash",
} as const;
