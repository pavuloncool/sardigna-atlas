/**
 * Generator geometrii mapy Atlasu (uruchamiany ręcznie: `pnpm map:build`).
 *
 * Wejście: granice gmin ISTAT (wersja uogólniona, Fonte: ISTAT, CC BY 4.0) + przydział gmin do krain
 * (`comuni-regions.csv`) + przydział krain do regionów (`subregions.csv`).
 * Wyjście: `web/lib/atlasMap.generated.ts` (viewBox, kontur wyspy, jednostki mapy z etykietami).
 *
 * Jednostka mapy = jeden z 10 regionów albo osobna „inna kraina” (region `inne`), rysowana na szaro.
 * Granice powstają przez złączenie (dissolve) gmin; uproszczenie zachowuje wspólne granice, więc bez luk.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import mapshaper from "mapshaper";
import polylabel from "polylabel";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const HERE = join(ROOT, "scripts", "map");
const CACHE = join(HERE, ".cache");
const ISTAT_URL = "https://www.istat.it/storage/cartografia/confini_amministrativi/generalizzati/2025/Limiti01012025_g.zip";
const OUT = join(ROOT, "web", "lib", "atlasMap.generated.ts");

/** Nazwy wyświetlane dla 10 regionów (id = `place.mapId` w Sanity). */
const REGION_NAMES: Record<string, string> = {
  nurra: "Nurra",
  gallura: "Gallura",
  logudoro: "Logudoro",
  oristano: "Oristano",
  baronia: "Baronìa",
  barbagia: "Barbagia",
  ogliastra: "Ogliastra",
  campidano: "Campidano",
  sulcis: "Sulcis",
  sarrabus: "Sarrabus",
};
/** Nazwa dla scalonych krain (Campidano di X itp. są w jednym regionie, więc tu tylko „inne”). */
const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const LON0 = 8.1;
const LAT0 = 41.3;
const K = Math.cos((40 * Math.PI) / 180) * 100;
const project = ([lon, lat]: number[]): [number, number] => [(lon - LON0) * K, (LAT0 - lat) * 100];
const MIN_RING_AREA = 0.8; // jednostki viewBox²; odcina skały i wysepki

function parseCsv(file: string) {
  const [head, ...rows] = readFileSync(file, "utf8").trim().split("\n");
  const cols = head.split(",");
  return rows.map((line) => {
    const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.slice(0, cols.length).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, ""));
    return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
  });
}

async function istat(): Promise<string> {
  const shp = join(CACHE, "istat", "Com01012025_g", "Com01012025_g_WGS84.shp");
  if (existsSync(shp)) return shp;
  mkdirSync(CACHE, { recursive: true });
  const zip = join(CACHE, "limiti.zip");
  console.log("Pobieram", ISTAT_URL);
  execFileSync("curl", ["-fsSL", "-o", zip, ISTAT_URL]);
  execFileSync("unzip", ["-q", "-o", zip, "-d", join(CACHE, "istat")]);
  return shp;
}

type Ring = number[][];
type Geom = { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
const polys = (g: Geom): Ring[][] => (g.type === "Polygon" ? [g.coordinates as Ring[]] : (g.coordinates as Ring[][]));
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

function labelOf(g: Geom): [number, number] {
  const biggest = polys(g).map((p) => p.map((r) => r.map(project))).sort((a, b) => ringArea(b[0]) - ringArea(a[0]))[0];
  const [x, y] = polylabel(biggest, 0.1) as unknown as number[];
  return [+x.toFixed(1), +y.toFixed(1)];
}

async function main() {
  const shp = await istat();
  const comuni = new Map(parseCsv(join(HERE, "comuni-regions.csv")).map((r) => [String(r.pro_com), r.subregion]));
  const toRegion = new Map(parseCsv(join(HERE, "subregions.csv")).map((r) => [r.subregion, r.region]));

  // 1. Sardynia w WGS84 jako GeoJSON
  const step1 = await mapshaper.applyCommands(`-i "${shp}" -filter 'COD_REG==20' -proj wgs84 -o out.json format=geojson`);
  const fc = JSON.parse(step1["out.json"].toString());

  // 2. jednostka mapy dla każdej gminy
  const missing: string[] = [];
  for (const f of fc.features) {
    const sub = comuni.get(String(f.properties.PRO_COM));
    const region = sub && toRegion.get(sub);
    if (!sub || !region) { missing.push(f.properties.COMUNE); continue; }
    f.properties = { unit: region === "inne" ? `inne:${sub}` : region };
  }
  if (missing.length) throw new Error(`Gminy bez przydziału: ${missing.join(", ")}`);
  const regionsUsed = new Set(fc.features.map((f: { properties: { unit: string } }) => f.properties.unit));
  for (const id of Object.keys(REGION_NAMES)) if (!regionsUsed.has(id)) throw new Error(`Region bez gmin: ${id}`);

  // 3. dissolve + uproszczenie (topologia zachowana)
  const step3 = await mapshaper.applyCommands(
    `-i in.json -dissolve unit -simplify visvalingam 6% keep-shapes -o units.json format=geojson -dissolve + name=coast -o coast.json format=geojson`,
    { "in.json": JSON.stringify(fc) },
  );
  const units = JSON.parse(step3["units.json"].toString()).features as { properties: { unit: string }; geometry: Geom }[];
  const coast = JSON.parse(step3["coast.json"].toString()).geometries[0] as Geom;

  const all = polys(coast).flatMap((p) => p[0].map(project));
  const w = Math.max(...all.map((p) => p[0]));
  const h = Math.max(...all.map((p) => p[1]));
  const pad = 2;

  const entries = units.map((u) => {
    const unit = u.properties.unit;
    const isOther = unit.startsWith("inne:");
    const name = isOther ? unit.slice(5) : REGION_NAMES[unit];
    return { id: isOther ? slug(name) : unit, name, kind: isOther ? "other" : "region", d: toPath(u.geometry), label: labelOf(u.geometry) };
  });
  const order = Object.keys(REGION_NAMES);
  entries.sort((a, b) => (a.kind === b.kind ? (a.kind === "region" ? order.indexOf(a.id) - order.indexOf(b.id) : a.name.localeCompare(b.name)) : a.kind === "region" ? -1 : 1));

  const src = `
// PLIK GENEROWANY: scripts/map/build-atlas-map.ts (pnpm map:build). Nie edytować ręcznie.
// Źródło granic gmin: ISTAT, Confini delle unità amministrative a fini statistici (2025), CC BY 4.0.
// Przydział gmin do krain i regionów: scripts/map/comuni-regions.csv, scripts/map/subregions.csv.

export const MAP_VIEWBOX = "${-pad} ${-pad} ${Math.ceil(w) + 2 * pad} ${Math.ceil(h) + 2 * pad}";
export const MAP_COAST_PATH = ${JSON.stringify(toPath(coast))};

export type MapUnit = { id: string; name: string; kind: "region" | "other"; d: string; label: [number, number] };
export const MAP_UNITS: MapUnit[] = ${JSON.stringify(entries, null, 2)};
`;
  writeFileSync(OUT, src);
  const kb = (Buffer.byteLength(src) / 1024).toFixed(1);
  console.log(`Zapisano ${OUT} (${kb} kB), jednostek: ${entries.length} (regionów: ${entries.filter((e) => e.kind === "region").length})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
