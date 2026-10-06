/**
 * Mapa Atlasu: geometria jest GENEROWANA (`pnpm map:build`, scripts/map) z granic gmin ISTAT
 * i przydziału gmin do 29 subregionów wg mapy wzorcowej `SAR-Subregioni.jpg`.
 * `id` subregionu = `place.mapId` w Sanity.
 */
import { MAP_COAST_PATH, MAP_UNITS, MAP_VIEWBOX, type MapUnit } from "./atlasMap.generated";

export { MAP_COAST_PATH, MAP_UNITS, MAP_VIEWBOX };
export type { MapUnit };
export const MAP_REGIONS: MapUnit[] = MAP_UNITS;
