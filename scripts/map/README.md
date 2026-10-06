# Mapa Atlasu: generator geometrii

`pnpm map:build` pobiera granice gmin ISTAT (do `.cache/`, poza repo), łączy je według
`comuni-regions.csv` (gmina → kraina) i `subregions.csv` (kraina → region albo `inne`)
i zapisuje `web/lib/atlasMap.generated.ts`. Wynik jest commitowany, build strony nie pobiera danych.

- Zmiana przydziału: edytuj CSV, uruchom `pnpm map:build`, sprawdź wynik na `/pl/atlas/`.
- `region = inne` → szara „inna kraina” (tooltip, bez linku). Nowy region wymaga też wpisu w `REGION_NAMES`
  w skrypcie, w liście `mapId` w `studio/schemaTypes/place.ts` i w teście `tests-unit/atlas-map.test.ts`.
- Źródło: ISTAT, Confini delle unità amministrative a fini statistici (2025), licencja CC BY 4.0.
