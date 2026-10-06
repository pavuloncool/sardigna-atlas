/**
 * Generator geometrii mapy Atlasu (uruchamiany ręcznie: `pnpm map:build`).
 *
 * Wejście: granice gmin ISTAT (wersja uogólniona, Fonte: ISTAT, CC BY 4.0) + przydział gmin
 * (i ich eksklaw) do subregionów (`comuni-regions.csv`, z `pnpm map:assign`) + nazwy subregionów
 * (`subregions.csv`; `id` = `place.mapId` w Sanity).
 * Wyjście: `web/lib/atlasMap.generated.ts` (viewBox, kontur wyspy, subregiony z etykietami).
 *
 * Granice powstają przez złączenie (dissolve) gmin; uproszczenie zachowuje wspólne granice, więc bez luk.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import mapshaper from "mapshaper";
import polylabel from "polylabel";
import { HERE, ROOT, istat, parseCsv, polys, type Geom, type Ring } from "./lib";

const OUT = join(ROOT, "web", "lib", "atlasMap.generated.ts");

const LON0 = 8.1;
const LAT0 = 41.3;
const K = Math.cos((40 * Math.PI) / 180) * 100;
const project = ([lon, lat]: number[]): [number, number] => [(lon - LON0) * K, (LAT0 - lat) * 100];
const MIN_RING_AREA = 0.8; // jednostki viewBox²; odcina skały i wysepki
/** Etykieta na mapie: rozmiar fontu i wysokość linii w jednostkach viewBox (zgodne z globals.css). */
const FONT = 3.2;
const LINE = 3.6;
const CHAR_W = 0.56; // średnia szerokość znaku Hanken Grotesk względem rozmiaru fontu (z zapasem)

const ringArea = (r: Ring) => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);

function toPath(g: Geom) {
  const out: string[] = [];
  for (const poly of polys(g)) {
    const outer = poly[0].map(project);
    if (ringArea(outer) < MIN_RING_AREA) continue;
    for (const ring of poly) {
      const pts = ring.map(project);
      const d = pts.slice(0, -1).map((p) => p.map((v) => +v.toFixed(1)).join(" "));
      out.push("M" + d.join("L") + "Z");
    }
  }
  return out.join("");
}

/** Etykieta w środku największego koła wpisanego; nazwa w 1 lub 2 liniach, tylko jeśli się mieści. */
function labelOf(g: Geom, text: string) {
  const biggest = polys(g).map((p) => p.map((r) => r.map(project))).sort((a, b) => ringArea(b[0]) - ringArea(a[0]))[0];
  const p = polylabel(biggest, 0.1);
  // podział na słowa (myślnik zostaje na końcu linii), 1–3 linie
  const words = text.replace(/-/g, "- ").split(" ");
  const join = (ws: string[]) => ws.join(" ").replace(/- /g, "-");
  const options: string[][] = [[text]];
  for (let i = 1; i < words.length; i++) {
    options.push([join(words.slice(0, i)), join(words.slice(i))]);
    for (let j = i + 1; j < words.length; j++) options.push([join(words.slice(0, i)), join(words.slice(i, j)), join(words.slice(j))]);
  }
  const width = (lines: string[]) => Math.max(...lines.map((l) => l.length)) * FONT * CHAR_W;
  const fits = (lines: string[]) => width(lines) <= 2 * p.distance * 1.15 && lines.length * LINE <= 2 * p.distance;
  const lines = options.filter(fits).sort((a, b) => width(a) - width(b) || a.length - b.length)[0] ?? null;
  return { at: [+p[0].toFixed(1), +p[1].toFixed(1)] as [number, number], lines };
}

async function main() {
  const subs = parseCsv(join(HERE, "subregions.csv"));
  const byId = new Map(subs.map((s) => [s.id, s]));
  const assign = parseCsv(join(HERE, "comuni-regions.csv"));
  const whole = new Map(assign.filter((r) => r.part === "").map((r) => [r.pro_com, r.subregion]));
  const exclave = new Map(assign.filter((r) => r.part !== "").map((r) => [`${r.pro_com}:${r.part}`, r.subregion]));
  for (const r of assign) if (!byId.has(r.subregion)) throw new Error(`Nieznany subregion ${r.subregion} (${r.comune})`);

  // 1. Sardynia w WGS84; każda część gminy (eksklawa) osobno
  const step1 = await mapshaper.applyCommands(`-i "${istat()}" -filter 'COD_REG==20' -proj wgs84 -o out.json format=geojson`);
  const fc = JSON.parse(step1["out.json"].toString()) as { features: { properties: { PRO_COM: number; COMUNE: string }; geometry: Geom }[] };
  const missing: string[] = [];
  const features = fc.features.flatMap((f) => {
    const id = String(f.properties.PRO_COM);
    const base = whole.get(id);
    if (!base) { missing.push(f.properties.COMUNE); return []; }
    return polys(f.geometry).map((poly, part) => ({
      type: "Feature",
      properties: { unit: exclave.get(`${id}:${part}`) ?? base },
      geometry: { type: "Polygon", coordinates: poly },
    }));
  });
  if (missing.length) throw new Error(`Gminy bez przydziału: ${missing.join(", ")}`);
  const used = new Set(features.map((f) => f.properties.unit));
  const empty = subs.filter((s) => !used.has(s.id)).map((s) => s.id);
  if (empty.length) throw new Error(`Subregiony bez gmin: ${empty.join(", ")}`);

  // 2. dissolve + uproszczenie (topologia zachowana)
  const step2 = await mapshaper.applyCommands(
    `-i in.json -dissolve unit -simplify visvalingam 6% keep-shapes -o units.json format=geojson -dissolve + name=coast -o coast.json format=geojson`,
    { "in.json": JSON.stringify({ type: "FeatureCollection", features }) },
  );
  const units = JSON.parse(step2["units.json"].toString()).features as { properties: { unit: string }; geometry: Geom }[];
  const coast = JSON.parse(step2["coast.json"].toString()).geometries[0] as Geom;

  const all = polys(coast).flatMap((p) => p[0].map(project));
  const w = Math.max(...all.map((p) => p[0]));
  const h = Math.max(...all.map((p) => p[1]));
  const pad = 2;

  const order = subs.map((s) => s.id);
  const entries = units
    .map((u) => {
      const s = byId.get(u.properties.unit)!;
      const { at, lines } = labelOf(u.geometry, s.short);
      return { id: s.id, name: s.name, short: s.short, d: toPath(u.geometry), at, lines };
    })
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  const src = `// PLIK GENEROWANY: scripts/map/build-atlas-map.ts (pnpm map:build). Nie edytować ręcznie.
// Źródło granic gmin: ISTAT, Confini delle unità amministrative a fini statistici (2025), CC BY 4.0.
// Podział na subregiony: SAR-Subregioni.jpg → scripts/map/comuni-regions.csv (pnpm map:assign), nazwy: subregions.csv.

export const MAP_VIEWBOX = "${-pad} ${-pad} ${Math.ceil(w) + 2 * pad} ${Math.ceil(h) + 2 * pad}";
export const MAP_COAST_PATH = ${JSON.stringify(toPath(coast))};

/** Subregion mapy; \`id\` = \`place.mapId\` w Sanity. \`lines\`: etykieta na mapie (null = nie mieści się, zostaje tooltip). */
export type MapUnit = { id: string; name: string; short: string; d: string; at: [number, number]; lines: string[] | null };
export const MAP_UNITS: MapUnit[] = ${JSON.stringify(entries, null, 2)};
`;
  writeFileSync(OUT, src);
  const kb = (Buffer.byteLength(src) / 1024).toFixed(1);
  console.log(`Zapisano ${OUT} (${kb} kB), subregionów: ${entries.length}, bez etykiety: ${entries.filter((e) => !e.lines).map((e) => e.short).join(", ") || "brak"}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
