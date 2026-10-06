import Link from "@/components/Link";
import { MAP_OTHERS, MAP_REGIONS, MAP_VIEWBOX, type MapUnit } from "@/lib/atlasMap";
import { MapInteraction } from "./MapInteraction";

export type MapRegion = {
  mapId: string;
  name: string;
  href: string;
  /** Gotowy opis („2 artykuły”), liczony po stronie serwera dla danego języka. */
  countLabel: string;
  articleCount: number;
};

/**
 * Klikalna mapa regionów (inline SVG, bez Mapbox/Leaflet), komponent serwerowy: geometria
 * jest w HTML, nie w paczce JS. Wszystkie 10 regionów jest zawsze narysowanych: te z `place.mapId`
 * w Sanity są linkami z tooltipem (nazwa i liczba artykułów), pozostałe wygaszone („wkrótce”).
 * Szare „inne krainy” (Marmilla, Gerrei…) mają tylko tooltip. Interakcję (hover, fokus, dotyk,
 * Escape) dodaje `MapInteraction`; bez JS zostaje mapa z linkami i lista regionów pod nią.
 */
export function AtlasMap({
  regions,
  label,
  soon,
  other,
  source,
}: {
  regions: MapRegion[];
  label: string;
  soon: string;
  other: string;
  source: string;
}) {
  const linked = new Map(regions.map((r) => [r.mapId, r]));

  function unit(u: MapUnit) {
    const hit = u.kind === "region" ? linked.get(u.id) : undefined;
    const tip =
      u.kind === "other" ? `${u.name} · ${other}` : hit ? `${hit.name} · ${hit.countLabel}` : `${u.name} · ${soon}`;
    const level = hit ? (hit.articleCount >= 3 ? 3 : hit.articleCount >= 1 ? 2 : 1) : 0;
    const path = (
      <path d={u.d} fillRule="evenodd" className={`region ${hit ? `lv${level}` : u.kind === "other" ? "other" : "soon"}`} />
    );
    const common = { "data-unit": "", "data-id": u.id, "data-tip": tip, "aria-label": tip };
    return hit ? (
      <Link key={u.id} href={hit.href} className="region-link" {...common}>
        {path}
      </Link>
    ) : (
      <g key={u.id} tabIndex={0} role="img" className="region-static" {...common}>
        {path}
      </g>
    );
  }

  return (
    <MapInteraction>
      <svg viewBox={MAP_VIEWBOX} role="group" aria-label={label}>
        <g>{MAP_OTHERS.map(unit)}</g>
        <g>{MAP_REGIONS.map(unit)}</g>
        <g aria-hidden="true" className="region-names">
          {MAP_REGIONS.map((u) => (
            <text key={u.id} x={u.label[0]} y={u.label[1]} data-id={u.id}>
              {u.name}
            </text>
          ))}
        </g>
      </svg>
      <ul className="map-legend">
        {MAP_REGIONS.map((u) => {
          const hit = linked.get(u.id);
          return hit ? (
            <li key={u.id} data-legend data-id={u.id}>
              <Link href={hit.href}>{hit.name}</Link> <span>{hit.countLabel}</span>
            </li>
          ) : (
            <li key={u.id} data-legend data-id={u.id} className="soon">
              {u.name} <span>{soon}</span>
            </li>
          );
        })}
      </ul>
      <p className="map-source">{source}</p>
    </MapInteraction>
  );
}
