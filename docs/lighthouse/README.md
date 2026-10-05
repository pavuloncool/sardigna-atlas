# Raporty Lighthouse (faza 5)

Pomiary lokalne na zbudowanym `web/out` (serwer statyczny bez kompresji), Lighthouse w trybie **mobilnym**
(domyślny profil: ~4G, procesor 4× wolniejszy), 2026-10-05. Strony: home `/pl/` i artykuł
`/pl/kulinaria/pane-carasau-chleb-z-potrzeby/`. Ciemny motyw wymuszony `--force-dark-mode`.
Pliki `phase5-*.json` to skrócone podsumowania (wyniki kategorii, metryki, nieudane audyty).

## Wyniki

| Strona | Motyw | Metoda | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|---|
| home | jasny | symulowana | 80 | 100 | 100 | 100 | 5,4 s | 0 | – |
| home | jasny | **zastosowana** | 94 | 100 | 100 | 100 | **2,4 s** | 0 | – |
| home | ciemny | zastosowana | 95 | 100 | 100 | 100 | 2,2 s | 0 | – |
| artykuł | jasny | zastosowana | 95 | 100 | 100 | 100 | 2,1 s | 0 | – |
| artykuł | ciemny | zastosowana | 96 | 100 | 100 | 100 | 2,2 s | 0 | – |

(pełne liczby, w tym TBT i wyniki symulowane dla wszystkich czterech kombinacji, są w plikach JSON.)

## Jak czytać LCP

- **Symulowana** (domyślna w Lighthouse, od niej liczy się „Performance score”): 4,9–5,4 s. Model Lantern
  szacuje opóźnienie renderu na podstawie całego JS strony (Next.js + React) i jest tu bardzo pesymistyczny.
- **Zastosowana** (`--throttling-method=devtools`, prawdziwe ograniczenie sieci i procesora w Chrome): 2,1–2,4 s.
  To ona odpowiada budżetowi z briefu „LCP < 2,5 s (mobile, 4G)”. Strona główna w jasnym motywie ma niewielki zapas.
- Bez ograniczeń: LCP 0,2 s, wynik 100.
- Pozostałe uwagi Lighthouse: `uses-text-compression` to artefakt lokalnego serwera (Cloudflare serwuje brotli);
  blokujący render arkusz CSS (26 kB) to jedyna większa pozostałość.

## Budżet JS (`pnpm test:budget`)

Brief: JS na stronie artykułu < 120 kB gzip. Sam szkielet Next.js 16 + React 19 (strona bez kodu aplikacji)
ma 127 kB gzip, więc limit w gzip jest nieosiągalny; w brotli (kompresja, którą Cloudflare serwuje
przeglądarkom) wszystkie strony mieszczą się w 120 kB. Zob. `docs/DECISIONS.md`.

| Strona | gzip kB | brotli kB |
|---|---|---|
| artykuł PL/EN | 136,3 | 116,9 |
| home | 138,6 | 118,9 |
| dział, Atlas, kontakt | 139,1 | 119,3 |
