/**
 * Własny loader next/image dla statycznego eksportu (obrazy z cdn.sanity.io).
 * Szerokości pochodzą z `images.deviceSizes` w next.config.ts (480/768/1200/1800),
 * jakość domyślnie 75, `auto=format` dodaje image-url.
 */
export default function sanityLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const url = new URL(src);
  const ar = Number(url.searchParams.get("ar"));
  url.searchParams.delete("ar");
  url.searchParams.set("w", String(width));
  if (ar > 0) url.searchParams.set("h", String(Math.round(width / ar)));
  url.searchParams.set("q", String(quality ?? 75));
  return url.toString();
}
