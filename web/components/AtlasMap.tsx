import Link from "@/components/Link";
import { MAP_REGIONS, MAP_VIEWBOX, type MapUnit } from "@/lib/atlasMap";
import { MapInteraction } from "./MapInteraction";

/** Wysokość linii etykiety w jednostkach viewBox (font 3,2 w globals.css; zgodnie z generatorem). */
const LINE = 3.6;

export type MapRegion = {
  mapId: string;
  name: string;
  href: string;
  /** Gotowy opis („2 artykuły”), liczony po stronie serwera dla danego języka. */
  countLabel: string;
  articleCount: number;
};

/**
 * Klikalna mapa 29 subregionów (inline SVG, bez Mapbox/Leaflet), komponent serwerowy: geometria
 * jest w HTML, nie w paczce JS. Subregion z `place.mapId` w Sanity jest linkiem z tooltipem (pełna
 * nazwa i liczba artykułów); bez dokumentu w Sanity jest wygaszony („wkrótce”). Etykieta na mapie
 * tylko tam, gdzie się mieści (`lines`), tooltip zawsze. Interakcję (hover, fokus, dotyk, Escape)
 * dodaje `MapInteraction`; bez JS zostaje mapa z linkami i lista subregionów pod nią.
 */
export function AtlasMap({
  regions,
  label,
  soon,
  source,
}: {
  regions: MapRegion[];
  label: string;
  soon: string;
  source: string;
}) {
  const linked = new Map(regions.map((r) => [r.mapId, r]));

  function unit(u: MapUnit) {
    const hit = linked.get(u.id);
    const tip = hit ? `${hit.name} · ${hit.countLabel}` : `${u.name} · ${soon}`;
    const level = hit ? (hit.articleCount >= 3 ? 3 : hit.articleCount >= 1 ? 2 : 1) : 0;
    const path = <path d={u.d} fillRule="evenodd" className={`region ${hit ? `lv${level}` : "soon"}`} />;
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
        <g>{MAP_REGIONS.map(unit)}</g>
        <g aria-hidden="true" className="region-names">
          {MAP_REGIONS.filter((u) => u.lines).map((u) => (
            <text key={u.id} x={u.at[0]} y={u.at[1] - ((u.lines!.length - 1) * LINE) / 2} data-id={u.id}>
              {u.lines!.map((l, i) => (
                <tspan key={i} x={u.at[0]} dy={i ? LINE : 0}>
                  {l}
                </tspan>
              ))}
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
