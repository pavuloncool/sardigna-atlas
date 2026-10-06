import type { Locale } from "@/lib/i18n/locales";
import { getDictionary, plural } from "@/lib/i18n/dictionary";
import { entityPath } from "@/lib/i18n/segments";
import { AtlasMap } from "./AtlasMap";

export type MapPlace = { _id: string; name: string | null; slug: string | null; mapId: string | null; articleCount: number };

/** Mapa Explore + lista regionów (wersja zastępcza bez JS i dla czytników ekranu, renderowana w AtlasMap). */
export function MapSection({ regions, locale }: { regions: MapPlace[]; locale: Locale }) {
  const dict = getDictionary(locale);
  const list = regions
    .filter((r) => r.mapId && r.slug && r.name)
    .map((r) => ({
      mapId: r.mapId!,
      name: r.name!,
      href: entityPath(locale, "place", r.slug!),
      countLabel: plural(locale, r.articleCount, dict.count.article),
      articleCount: r.articleCount,
    }));

  return (
    <AtlasMap
      regions={list}
      label={dict.atlas.mapLabel}
      soon={dict.atlas.mapSoon}
      other={dict.atlas.mapOther}
      source={dict.atlas.mapSource}
    />
  );
}
