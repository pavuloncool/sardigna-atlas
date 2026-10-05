import Link from "@/components/Link";
import type { Locale } from "@/lib/i18n/locales";
import { getDictionary, plural } from "@/lib/i18n/dictionary";
import { entityPath } from "@/lib/i18n/segments";
import { AtlasMap } from "./AtlasMap";

export type MapPlace = { _id: string; name: string | null; slug: string | null; mapId: string | null; articleCount: number };

/** Mapa Explore + lista regionów (wersja zastępcza bez JS i dla czytników ekranu). */
export function MapSection({ regions, locale }: { regions: MapPlace[]; locale: Locale }) {
  const dict = getDictionary(locale);
  const list = regions
    .filter((r) => r.mapId && r.slug && r.name)
    .map((r) => ({
      mapId: r.mapId!,
      name: r.name!,
      href: entityPath(locale, "place", r.slug!),
      countLabel: plural(locale, r.articleCount, dict.count.article),
    }));

  return (
    <>
      <AtlasMap regions={list} label={dict.atlas.mapLabel} />
      {list.length ? (
        <ul className="map-legend" style={{ padding: "0 8.3vw" }}>
          {list.map((r) => (
            <li key={r.mapId}>
              <Link href={r.href}>{r.name}</Link> <span>{r.countLabel}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
