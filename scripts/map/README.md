# Mapa Atlasu: 29 subregionów

Źródło podziału: mapa wzorcowa `SAR-Subregioni.jpg` (poza repo, w katalogu nadrzędnym projektu).
Granice: gminy ISTAT 2025 (CC BY 4.0), pobierane do `.cache/` (poza repo).

1. `pnpm map:assign [ścieżka do jpg]` → `comuni-regions.csv`: segmentacja obrazu, georeferencja
   do UTM 32N, każda gmina (i każda eksklawa osobno) do subregionu o największym udziale powierzchni.
   Kolumna `note`: gminy sporne (< 70%), eksklawy. Podgląd: `.cache/assign-preview.jpg`,
   `.cache/segments-preview.jpg`. Ręczne poprawki: edytuj CSV (nie uruchamiaj ponownie `map:assign`).
2. `pnpm map:build` → `web/lib/atlasMap.generated.ts` (commitowany, build strony nie pobiera danych).
3. Sanity: `cd studio && DRY_RUN=1 npx sanity exec scripts/sync-regions.ts --with-user-token`,
   potem bez `DRY_RUN` (tworzy/zmienia dokumenty `place` z `mapId` = `id` z `subregions.csv`).

Nazwy i `mapId`: `subregions.csv` (`short` = etykieta na mapie, `name` = tooltip i Sanity). Nowy
subregion wymaga też wpisu w liście `mapId` w `studio/schemaTypes/place.ts` (test pilnuje zgodności).
