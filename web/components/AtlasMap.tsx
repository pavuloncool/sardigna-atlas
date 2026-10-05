"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { MAP_COAST_PATH, MAP_REGIONS, MAP_VIEWBOX, mapRegionPath } from "@/lib/atlasMap";

export type MapRegion = {
  mapId: string;
  name: string;
  href: string;
  /** Gotowy opis („2 artykuły”), liczony po stronie serwera dla danego języka. */
  countLabel: string;
};

/**
 * Klikalna mapa regionów (inline SVG, bez Mapbox/Leaflet). Regiony z `place.mapId` w Sanity
 * są linkami (hover i fokus klawiatury pokazują tooltip z liczbą artykułów). Wersją zastępczą
 * bez JS jest lista pod mapą (`map-legend`), renderowana przez stronę Atlasu.
 */
export function AtlasMap({ regions, label }: { regions: MapRegion[]; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const linked = new Map(regions.map((r) => [r.mapId, r]));

  function show(e: { clientX: number; clientY: number }, text: string) {
    const b = box.current!.getBoundingClientRect();
    setTip({ text, x: e.clientX - b.left + 14, y: e.clientY - b.top + 14 });
  }
  function showAtElement(el: Element, text: string) {
    const r = el.getBoundingClientRect();
    const b = box.current!.getBoundingClientRect();
    setTip({ text, x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 });
  }

  return (
    <div className="atlas-map" ref={box}>
      <svg viewBox={MAP_VIEWBOX} role="group" aria-label={label}>
        <defs>
          <clipPath id="sardinia-clip">
            <path d={MAP_COAST_PATH} />
          </clipPath>
        </defs>
        <path d={MAP_COAST_PATH} className="region" />
        <g clipPath="url(#sardinia-clip)">
          {MAP_REGIONS.map((r) => {
            const hit = linked.get(r.id);
            const path = <path d={mapRegionPath(r.id)} className="region" />;
            if (!hit) return <g key={r.id}>{path}</g>;
            const text = `${hit.name} · ${hit.countLabel}`;
            return (
              <Link
                key={r.id}
                href={hit.href}
                className="region-link"
                aria-label={text}
                onMouseMove={(e) => show(e, text)}
                onMouseLeave={() => setTip(null)}
                onFocus={(e) => showAtElement(e.currentTarget, text)}
                onBlur={() => setTip(null)}
              >
                {path}
              </Link>
            );
          })}
        </g>
      </svg>
      {tip ? (
        <div className="map-tip" style={{ left: tip.x, top: tip.y }} role="status">
          {tip.text}
        </div>
      ) : null}
    </div>
  );
}
