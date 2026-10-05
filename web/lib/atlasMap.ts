/**
 * Schematyczna mapa Sardynii (własne uproszczenie, bez zewnętrznych danych i licencji).
 * Kontur wyspy i regiony to zgrubne wielokąty we współrzędnych (lon, lat), rzutowane
 * równoprostokątnie z korektą na szerokość geograficzną. Regiony są przycinane do konturu
 * (clipPath), więc ich granice mogą swobodnie wystawać poza wybrzeże.
 * `id` regionu = `place.mapId` w Sanity.
 */
type LonLat = [number, number];

const COAST: LonLat[] = [
  // północ (od Capo Falcone na wschód)
  [8.21, 40.97], [8.22, 40.93], [8.31, 40.86], [8.4, 40.84], [8.55, 40.83], [8.71, 40.91],
  [8.86, 40.95], [9.0, 41.08], [9.15, 41.24], [9.24, 41.24], [9.38, 41.18], [9.43, 41.11],
  [9.54, 41.13], [9.62, 41.03], [9.63, 40.98], [9.55, 40.95], [9.5, 40.92], [9.6, 40.86],
  [9.65, 40.83], [9.74, 40.82], [9.67, 40.77], [9.73, 40.7], [9.78, 40.62], [9.83, 40.53],
  // wschód
  [9.76, 40.45], [9.73, 40.38], [9.63, 40.28], [9.64, 40.16], [9.72, 40.08], [9.7, 39.99],
  [9.71, 39.93], [9.68, 39.8], [9.64, 39.7], [9.63, 39.55], [9.62, 39.42], [9.64, 39.3],
  [9.59, 39.18], [9.52, 39.1], [9.38, 39.17], [9.25, 39.2], [9.14, 39.2],
  // południe
  [9.0, 39.1], [9.0, 38.99], [8.85, 38.88], [8.65, 38.87], [8.58, 38.97], [8.48, 38.98],
  [8.4, 38.95], [8.37, 39.08], [8.4, 39.18], [8.4, 39.3],
  // zachód
  [8.4, 39.45], [8.45, 39.55], [8.47, 39.72], [8.45, 39.8], [8.4, 39.87], [8.48, 39.91],
  [8.55, 39.88], [8.42, 40.03], [8.46, 40.15], [8.47, 40.3], [8.35, 40.45], [8.3, 40.55],
  [8.16, 40.57], [8.12, 40.72], [8.15, 40.85],
];

export const MAP_REGIONS: { id: string; name: string; poly: LonLat[] }[] = [
  { id: "nurra", name: "Nurra", poly: [[8.0, 41.1], [8.75, 41.1], [8.75, 40.65], [8.0, 40.45]] },
  { id: "gallura", name: "Gallura", poly: [[8.75, 41.4], [9.95, 41.4], [9.95, 40.72], [9.3, 40.72], [9.05, 40.9], [8.75, 40.95]] },
  { id: "logudoro", name: "Logudoro", poly: [[8.75, 40.95], [9.05, 40.9], [9.3, 40.72], [9.3, 40.45], [8.85, 40.35], [8.75, 40.65]] },
  { id: "oristano", name: "Oristano", poly: [[8.0, 40.45], [8.75, 40.65], [8.85, 40.35], [8.95, 39.7], [8.0, 39.7]] },
  { id: "baronia", name: "Baronìa", poly: [[9.3, 40.72], [9.95, 40.72], [9.95, 40.15], [9.62, 40.28], [9.3, 40.45]] },
  { id: "barbagia", name: "Barbagia", poly: [[8.85, 40.35], [9.3, 40.45], [9.62, 40.28], [9.45, 40.15], [9.45, 39.6], [8.95, 39.7]] },
  { id: "ogliastra", name: "Ogliastra", poly: [[9.45, 40.15], [9.95, 40.15], [9.95, 39.6], [9.45, 39.6]] },
  { id: "campidano", name: "Campidano", poly: [[8.65, 39.7], [9.45, 39.6], [9.45, 39.3], [9.0, 39.3], [8.75, 39.3]] },
  { id: "sulcis", name: "Sulcis", poly: [[8.0, 39.75], [8.65, 39.7], [8.75, 39.3], [8.9, 38.7], [8.0, 38.7]] },
  { id: "sarrabus", name: "Sarrabus", poly: [[9.45, 39.6], [9.95, 39.6], [9.95, 38.9], [9.0, 38.9], [9.0, 39.3], [9.45, 39.3]] },
];

const LON0 = 8.1;
const LAT0 = 41.3;
const K = Math.cos((40 * Math.PI) / 180) * 100;

const project = ([lon, lat]: LonLat): [number, number] => [
  +((lon - LON0) * K).toFixed(1),
  +((LAT0 - lat) * 100).toFixed(1),
];
const toPath = (pts: LonLat[]) => "M" + pts.map((p) => project(p).join(" ")).join("L") + "Z";

export const MAP_VIEWBOX = `0 0 ${((9.95 - LON0) * K).toFixed(0)} ${((LAT0 - 38.8) * 100).toFixed(0)}`;
export const MAP_COAST_PATH = toPath(COAST);
export const mapRegionPath = (id: string) => toPath(MAP_REGIONS.find((r) => r.id === id)!.poly);
