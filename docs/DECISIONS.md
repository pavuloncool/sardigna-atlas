# Decyzje i odstępstwa od briefu

Format: decyzja, powód, alternatywa.

## 2026-10-05 — Faza 0

- **Język zarezerwowany to `de`, nie `it`.** Concept (`studio/lib/languages.ts`) używał `it`, brief (sekcja 1) mówi DE. Zmienione w `studio/lib/languages.ts`, `slugFromLocalized.ts`; fallback slugów `en → pl → de`. Alternatywa: zostawić `it` (odrzucone: sprzeczne z briefem).
- **Układ `web/app`, bez `src/`.** Zgodnie z sekcją 4 briefu i decyzją właściciela. Alias `@/*` → `./*`.
- **`turbopack.root` = korzeń workspace'u.** W pnpm workspace zależności leżą w `node_modules` korzenia; bez tego `next build` nie znajduje pakietu `next`.
- **`typecheck` w `web` uruchamia `next typegen`.** Typy `PageProps`/`LayoutProps` są generowane; bez nich `tsc` zgłasza błąd na czystym checkoucie.
- **`@sanity/client` jako zależność `web`.** Wygenerowany `sanity.types.ts` augmentuje ten moduł; przy ścisłym pnpm musi być zależnością bezpośrednią.
- **`typegen.path` obejmuje `web/{app,lib,components}`.** Zapytania żyją w `web/lib`.
- **Wersja pnpm przypięta w `packageManager`** (10.33.2).
- **`images.unoptimized: true`** dla statycznego eksportu; docelowo własny loader Sanity (faza 1).

## 2026-10-05 — Faza 1

- **Kolor szarego tekstu: `#757575` zamiast `#9a9a9a` w trybie jasnym.** `#9a9a9a` na `#fff` daje kontrast 2,8:1, poniżej AA (4,5:1), a brief wymaga AA (sekcja 8, AC fazy 1). `#757575` = 4,6:1. Tryb ciemny bez zmian (`#8a8a8a` na `#121212`). Alternatywa: zostawić `#9a9a9a` (odrzucone: łamie AC).
- **Dwa root layouty.** `app/(root)` (przekierowanie `/` → `/pl/`) i `app/[locale]` (właściwa strona z `<html lang={locale}>`). Jeden wspólny root layout nie może ustawić poprawnego `lang` per język bez middleware.
- **Header i Footer renderuje `PageShell` per strona, nie layout.** Tylko strona zna adresy tłumaczeń (`alternates`), więc przełącznik języka jest zwykłym linkiem i działa bez JS.
- **Menu mobilne to `<details>`** (działa bez JS). Prototyp ukrywał nawigację poniżej 900 px bez zastępnika.
- **Loader obrazów:** `images.loader: 'custom'` + `lib/sanity/imageLoader.ts`; szerokości 480/768/1200/1800 (`deviceSizes`), `imageSizes: [240]`, jakość 75. Proporcje kadru niesie parametr `ar` w URL (usuwany przez loader, który dodaje `w` i `h`).
- **Fonty przez `next/font/google`** (Hanken Grotesk 400/500/700, Newsreader 300): pobierane i hostowane w buildzie, brak żądań do domen Google w runtime.
- **Słowniki UI z fallbackiem na język domyślny** (`lib/i18n/dictionary.ts`) oraz mapa segmentów URL z fallbackiem `lang → en → pl` (`lib/i18n/segments.ts`): dodanie `de` nie wymaga zmian w komponentach.
- **Nawigacja: „Ludzie" dochodzi w fazie 3** (slug działu `people` pochodzi z Sanity). Pole wyszukiwania to na razie sam markup; Pagefind w fazie 3.
- **Typy obrazów ręczne** (`SanityImage`, `ArticleCardData`) do czasu fazy 2, kiedy pojawią się zapytania i typegen.

## 2026-10-05 — Strona główna 1:1 z prototypem (korekta fazy 1)

- **Faza 1 oddała tymczasowy pokaz komponentów zamiast home z prototypu; naprawione.** `app/[locale]/page.tsx` odtwarza prototyp: hero (`components/Hero.tsx`, logika `measure()`/`frame()` przeniesiona bez zmian), trzy kolumny, Opowieści, panorama, stopka. CSS hero/voices skopiowany z prototypu do `globals.css`.
- **Weryfikacja:** pozycje (`getBoundingClientRect`) znaku, słów, kolumn, zdjęć i stopki oraz `opacity` tekstu są identyczne z prototypem przy przewinięciach 0/150/336/673/1000/1400 (okno 1210×673) i 0/200/420/800/1100 (okno 1210×420). Wysokość dokumentu 2443 px i 1857 px w obu.
- **Świadome różnice względem prototypu** (poza wymaganiami briefu):
  1. szary tekst `#757575` zamiast `#9a9a9a` (kontrast AA; zob. wpis z fazy 1; przywrócenie = zmiana `--mute` w `:root`),
  2. stopka ma Polityka prywatności i Polityka cookies (sekcja 14 briefu) zamiast „Newsletter" (Resend Free nie obsługuje newslettera),
  3. poniżej 900 px jest menu `<details>` (prototyp ukrywał nawigację bez zastępnika).
- **Treść kolumn:** `web/content/home.pl.json` (tekst z prototypu), `home.en.json` oznaczony `[DRAFT]` do akceptacji redakcji. Karty Opowieści i zdjęcia to placeholdery do czasu danych z Sanity (faza 3).
- **`lib/i18n/categorySlugs.ts` jest TYMCZASOWA** (slugi sześciu działów); zastąpiona danymi `category.slugs` po fazie 2/3. Linki do działów i Atlasu dają na razie 404, bo te strony powstają w fazie 3.
- **`main` bez paddingu u góry na home** (`flush`), strony treści dostają `main.page`.

## 2026-10-05 — Faza 2 (model i dane)

- **Typ `tag`, pole `tags` na artykule i encjach (place, person, product, hotel, experience, restaurant), `pinnedRelated` na artykule (max 3, ten sam język).** Istniejące referencje zostają (sekcja 5a). Pole `related` z concepta (ręczne powiązania) zostaje, bo korzysta z niego dostarczone `articleBySlugQuery`; redakcji polecamy `pinnedRelated` (opis pola „pole starsze”). Do rozważenia usunięcie `related` w wersji 2.
- **Afiliacja (sekcja 12):** wspólny zestaw pól `affiliateUrl` (walidacja `https`), `affiliateNetwork`, `isAffiliate`, `isSponsored` w `studio/lib/fields.ts`, użyty w hotel, experience, product, restaurant. Hotel zachował `bookingUrl`; jego dawne `isAffiliate`/`isSponsored` przejął wspólny zestaw. Brak Amazona.
- **`restaurant` bez własnej strony w v1.0:** brief wymienia ten typ tylko przy afiliacji, a tabela routingu (sekcja 5) go nie zawiera.
- **Zmiany w dostarczonym `queries.ts` (wyjątek od zasady 7, test powtórzony):**
  1. `affiliateUrl`, `isAffiliate`, `isSponsored` dopisane do projekcji `hotelRef`, `experienceRef`, `productRef` (sekcja 12 wymaga ich na frontendzie),
  2. `sitemapQuery` używał `translationsProjection.replace(...)`, czego typegen nie wykonuje (zapytanie nie dostawało typów). Zastąpione literałem `alternatesProjection` o tej samej treści,
  3. dopisany `relatedQuery` (reszta zapytań bez zmian). `$lang` zostaje zamiast `$locale` z briefu (zob. wpis z fazy 0).
- **`relatedQuery`:** jeden wspólny zestaw „kluczy powiązań” (tagi + dział/miejsce/osoby/produkty/doświadczenia/noclegi/pochodzenie/wytwórcy + sam dokument). Kandydat kwalifikuje się, gdy `references(klucze)`. Zwraca tablicę lub `null` (brak dokumentu); frontend traktuje oba jako „bez bloku”. **Klucze muszą być liczone przez `^` (zakres bieżącego dokumentu).** Wersja z podzapytaniem `*[_id == $id][0]...` wewnątrz `references()` zwracała pusto na żywym API, mimo że groq-js ją akceptował: zbiór w pamięci nie wystarcza, zapytania trzeba weryfikować też na żywym datasecie. Encje bez nazwy w `$lang` są odfiltrowane (person i hotel mają nazwę niewielojęzyczną, więc zawsze przechodzą). `$limit` trzeba podawać zawsze (GROQ nie ma domyślnej wartości parametru).
- **Seed ma stałe `_id` z prefiksem `seed-`** (wyjątek od zasady „Sanity nadaje id”): relacje w NDJSON wymagają znanych id, a `--replace` pozwala powtórzyć import bez duplikatów. Obrazy to lokalnie generowane gradienty PNG (`scripts/seed/png.ts`), bez pobierania z sieci.
- **Test zapytań bez sieci i bez zapisu:** `pnpm verify:queries` (groq-js, zbiór seeda w pamięci): 26 asercji, w tym reguły bloku „Powiązane” z AC sekcji 5a.
- **Typegen:** `pnpm --filter sardigna-atlas-studio typegen`, 10 zapytań z typami. Sprawdzone: włączenie `de` w `studio/lib/languages.ts` nie wywraca typegenu ani `tsc`.
- **Seed: pole obrazu to `{_type: 'mediaImage', alt, _sanityAsset}`** (importer sam tworzy `asset`). Pierwsza wersja miała `asset: {_sanityAsset}` i dawała zagnieżdżone `asset.asset` bez LQIP; wykryte testem live, naprawione i zaimportowane ponownie (`--replace`).
- **Import do `production` (2026-10-05):** po zgodzie właściciela usunięto 9 testowych dokumentów treści (kopia: `backups/production-before-seed.tar.gz`, poza gitem) i zaimportowano 27 dokumentów seeda. `pnpm verify:live` (odczyt, perspektywa `published`) przechodzi: 19 asercji.
- **Testy:** `pnpm verify:queries` (pamięć, bez sieci) i `pnpm verify:live` (dataset) współdzielą przypadki z `scripts/cases.ts`.

## 2026-10-05 — Faza 3 (strony)

- **Routing przez trzy dynamiczne segmenty zamiast folderów per język.** Segmenty URL są tłumaczone (`o-projekcie`/`about`), a nazwy folderów w Next nie mogą zależeć od języka. Dlatego: `[locale]/[section]` (dział, Atlas, O projekcie, Kontakt, polityki; `resolveSection`), `[locale]/[section]/[slug]` (artykuł albo `strona-N`) i `[locale]/[section]/[group]/[slug]` (encje Atlasu). `generateStaticParams` + `dynamicParams = false` wyliczają dozwolone adresy z Sanity i listy języków.
- **Paginacja działu: `/{dział}/strona-2/` (PL), `/page-2/` (EN), 12 artykułów na stronę** (`PAGE_SIZE`). Slug artykułu o takiej nazwie kolidowałby ze stroną; do rozważenia walidacja slugów w Studio.
- **Slugi działów pochodzą z Sanity (`getCategories`).** Tymczasowa tabela `categorySlugs.ts` usunięta. Brakujący język → `en` → język domyślny.
- **Nowe zapytania dopisane do `queries.ts`:** `categoriesQuery`, `articleRoutesQuery`, `entityRoutesQuery`, `categoryArticlesQuery` (artykuły działu po kluczu, żeby `de` działał mimo braku slugu `de`), `atlasIndexQuery`. `entityHubQuery` dostał pola afiliacyjne, `websiteUrl`, `bookingUrl` i miejsce (potrzebne na stronach noclegu, doświadczenia i produktu).
- **Typy danych stron są ręczne (`lib/sanity/types.ts`).** Typegen opisuje dokumenty, ale pola liczone w GROQ (np. `slugs[$lang]`) wychodzą w nim zbyt luźne; strony używają `client.fetch<T>`. Typegen zostaje w CI jako kontrola zgodności schematu.
- **Strony statyczne z `web/content/*.md`, renderowane przez `marked` w buildzie** (nowa zależność: brief wymaga Markdowna renderowanego w buildzie, a nie podaje biblioteki). Treści to szkielety z `[PLACEHOLDER]`; polityki wymagają przeglądu prawnika (notatka w plikach).
- **Home:** wyróżniony artykuł (`featured`) otwiera Opowieści (jak lewa karta w prototypie), panorama 2,4:1 to zdjęcie następnego artykułu, a gdy go nie ma, okładka pierwszego działu z treścią. Sekcje działów i mapa Explore dochodzą pod spodem; geometria hero bez zmian (identyczne pomiary jak w prototypie).
- **Style nowych widoków wyprowadzone z tokenów prototypu** (marginesy 8,3vw/11vw, `--fs-display`, `--fs-card-title`, serif 300 dla lede, cienkie podkreślenia `--rule`, brak ramek i zaokrągleń). Nowe klasy: `.pg-head`, `.art-head`, `.art-hero`, `.art-body`, `.sec`, `.sec-head`, `.feed`, `.tiles`/`.tile`, `.pager`, `.plain-list`, `.atlas-map`, `.search-results`.
- **Mapa Explore to własne, schematyczne uproszczenie** (`lib/atlasMap.ts`: zgrubny kontur wyspy i 10 regionów jako wielokąty lon/lat, rzutowane równoprostokątnie, przycięte `clipPath`), bez zewnętrznych danych i licencji. Regiony linkują po `place.mapId` (w seedzie tylko `barbagia`); lista regionów pod mapą to wersja zastępcza bez JS. Wymaga docelowo lepszego rysunku (np. własna grafika SVG).
- **Wyszukiwarka: Pagefind** (`pagefind --site out` w skrypcie `build`, indeks per język z `<html lang>`, treść w `main[data-pagefind-body]`). UI w stylu pola z headera, wymaga JS; w `next dev` indeksu nie ma (komunikat zamiast błędu).
- **SEO:** canonical + hreflang (z `x-default`) przez `lib/seo.ts`, `sitemap.xml` z `sitemapQuery` (alternatywy `xhtml:link`) i `robots.txt` jako statyczne route handlery. Adres bazowy z `NEXT_PUBLIC_SITE_URL` (lokalnie `http://localhost:3000`, produkcyjny ustawić w Cloudflare).
- **`AdSlot` + `Feed`:** slot co `AD_EVERY = 6` pozycji, ukryty (`hidden`) przy `NEXT_PUBLIC_ADS_ENABLED=false`, `aria-hidden`, z zarezerwowaną wysokością. Seed ma za mało artykułów, żeby slot się pojawił, więc jego wstawianie nie jest jeszcze sprawdzone na danych.
- **Testy:** `pnpm test:links` (crawler `out/`: 1929 odnośników, brak martwych; sprawdzony na sztucznie zepsutym linku), `pnpm test:e2e` (Playwright na zainstalowanym Chrome, 5 przypadków: gwarancja układu hero dla 1210×420/540/700 i 1600×900 co 20 px + fallback statyczny).
- **AC dla `de`:** po włączeniu `de` w `web/lib/i18n/locales.ts` build daje 21 stron `/de/…` + encje, 71 stron razem, 2804 odnośniki bez martwych (sprawdzone i cofnięte).
- **Znane braki fazy 3:** brak własnej strony 404 w języku serwisu (domyślna z Next), JSON-LD i obrazy OG dochodzą w fazie 5, formularz kontaktowy w fazie 4.

## 2026-10-05 — Cloudflare Pages (CP3)

- **Projekt Pages `sardigna-atlas` utworzony przez API** (po autoryzacji aplikacji GitHub „Cloudflare Workers & Pages” przez właściciela): source `pavuloncool/sardigna-atlas`, branch `main`, root `web`, build `pnpm --filter web build`, wyjście `out`. Podgląd: każdy branch/PR dostaje adres `*.sardigna-atlas.pages.dev` (branch deploy, sekcja 6 briefu).
- **Zmienne build:** `NODE_VERSION=22`, `PNPM_VERSION=10.33.2` (build image v3 ma domyślnie pnpm 10.11.1 i nie wykrywa wersji z lockfile), `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION`, `NEXT_PUBLIC_SITE_URL=https://mysardinia.online` (tylko production), `NEXT_PUBLIC_ADS_ENABLED=false`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; `TURNSTILE_SECRET_KEY` jako secret (production i preview).
- **Turnstile:** widget zarządzany (managed) dla `mysardinia.online`, `sardigna-atlas.pages.dev`, `localhost`.
- **Domena:** `mysardinia.online` (strefa na koncie Cloudflare) dodana do projektu; wymaga rekordu `CNAME @ → sardigna-atlas.pages.dev` (proxied), bo token OAuth wranglera nie ma zapisu DNS.
- **`web/public/_redirects`:** `/ → /pl/` (302). Przekierowanie klienckie z `app/(root)` zostaje jako zapasowe.
- **Funkcje Pages:** katalog `functions` leży w roocie projektu, czyli `web/functions` (dokumentacja Cloudflare: „at the root of your Pages project”, przy ustawionym root dir).
