/**
 * Mapa Atlasu: geometria jest GENEROWANA (`pnpm map:build`, scripts/map) z granic gmin ISTAT
 * i przydziału gmin do krain (scripts/map/*.csv). Tu tylko podział na 10 regionów (klikalnych,
 * `id` = `place.mapId` w Sanity) i „inne krainy” (szare, bez strony w Atlasie).
 */
import { MAP_COAST_PATH, MAP_UNITS, MAP_VIEWBOX, type MapUnit } from "./atlasMap.generated";

export { MAP_COAST_PATH, MAP_UNITS, MAP_VIEWBOX };
export type { MapUnit };
export const MAP_REGIONS: MapUnit[] = MAP_UNITS.filter((u) => u.kind === "region");
export const MAP_OTHERS: MapUnit[] = MAP_UNITS.filter((u) => u.kind === "other");
