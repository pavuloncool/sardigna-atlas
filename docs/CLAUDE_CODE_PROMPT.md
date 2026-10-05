# Sardigna Atlas — brief wdrożeniowy dla Claude Code

Wklej ten plik jako pierwszą wiadomość w Claude Code, w katalogu pustego repo, po skopiowaniu tam folderów `studio/` i `web/` z tego pakietu.

---

## 0. Zasady pracy

1. Pracuj fazami z sekcji 6. Po każdej fazie: `pnpm typecheck && pnpm lint && pnpm build`, potem commit z opisem fazy.
2. **Hosting to wyłącznie Cloudflare** (Pages, z przenośnością do Workers static assets). Na żadnym etapie nie używaj Vercela — ani do wdrożenia, ani do podglądów, ani do CI, ani jako zależności (`@vercel/*`). To nie podlega negocjacji i nie wymaga wpisu w `DECISIONS.md`.
3. Nie dodawaj płatnych usług ani zależności spoza briefu bez pytania. Każde odstępstwo zapisz w `docs/DECISIONS.md` (decyzja, powód, alternatywa).
4. Nie wymyślaj treści. Seed ma zawierać wyraźnie oznaczone placeholdery (`[PLACEHOLDER]`) i zdjęcia generowane lokalnie (jednolite kolory, gradienty). Nie pobieraj zdjęć z internetu.
5. Wersje bibliotek (Next.js, Sanity, `next-sanity`, Wrangler) są nowsze niż Twoja wiedza treningowa. Przed użyciem API sprawdź aktualną dokumentację.
6. Limity i ceny z sekcji 3 pochodzą z września 2026. Zweryfikuj je w oficjalnej dokumentacji przed założeniem, że nadal obowiązują.
7. Dostarczone pliki są już zweryfikowane: schematy w `studio/` przechodzą `tsc` i kompilację `@sanity/schema`, a zapytania w `web/lib/sanity/queries.ts` parsują się i zwracają poprawne wyniki na zbiorze testowym. Nie przepisuj ich (dotyczy też prototypu hero z sekcji 7). Zmieniaj tylko z uzasadnieniem w `DECISIONS.md` i powtórz test.

## 1. Produkt

**Sardigna Atlas** to dwujęzyczny (PL + EN, DE zarezerwowany) magazyn i atlas kulturowy o Sardynii: kulinaria i produkty regionalne, rękodzieło, hotele, doświadczenia, historia, ludzie. Ma być promowany publicznie, więc liczy się jakość designu, SEO i szybkość.

Główne założenie biznesowe: **darmowe narzędzia i darmowy stos**. Monetyzacja afiliacyjna jest **potwierdzona od startu** (sekcja 12), a Google AdSense In-Feed to faza późniejsza z gotową architekturą od pierwszego dnia (sekcja 13). Hosting musi dopuszczać użycie komercyjne.

**Trzeci język (DE).** Start to PL + EN, ale struktura ma być przygotowana tak, żeby dodanie niemieckiego sprowadzało się do dopisania kodu języka, a nie przebudowy schematu:
- lista języków w jednym miejscu (`lib/i18n/locales.ts` + odpowiednik w `studio/`), importowana wszędzie; nigdy nie zapisuj `'pl' | 'en'` na sztywno w komponentach, zapytaniach ani typach;
- pola wielojęzyczne encji to obiekty z kluczem per język generowane z tej listy, nie ręcznie wypisane pola `titlePl` / `titleEn`;
- mapa segmentów URL, słowniki UI i `generateStaticParams` iterują po liście języków;
- zapytania GROQ parametryzuj `$locale`, z fallbackiem na `pl`, gdy tłumaczenia brak.
*AC trzeciego języka*: dodanie `de` do listy języków i uruchomienie builda daje kompletne ścieżki `/de/…` bez zmian w komponentach (treść może być pusta / fallback).

Dwie warstwy produktu:
- **Journal**: artykuły w sześciu działach.
- **Atlas**: strony encji (miejsca, ludzie, produkty, noclegi, doświadczenia), które automatycznie zbierają wszystkie artykuły do nich prowadzące, oraz klikalna mapa regionów.

## 2. Stos (decyzje zamknięte)

| Warstwa | Wybór | Uwagi |
|---|---|---|
| Frontend | Next.js (App Router), TypeScript strict, Tailwind | `output: 'export'` (pełny SSG), `trailingSlash: true` |
| CMS | Sanity Studio hostowane (`sanity deploy`) | schematy w `studio/`, dataset `production` |
| Tłumaczenia | `@sanity/document-internationalization` | Article = dokument per język; encje = pola wielojęzyczne |
| i18n we froncie | segment `[locale]` + `generateStaticParams`, `dynamicParams = false` | bez middleware (nie działa w eksporcie statycznym); słowniki UI w JSON; `/` = statyczne przekierowanie na `/pl` |
| Hosting | Cloudflare Pages (git-connected), katalog wyjściowy `web/out` | zachowaj przenośność do Workers static assets (`wrangler.jsonc` z `assets.directory`) |
| Kontakt | Pages Function `web/functions/api/contact.ts` → Resend REST API (`fetch`) | Turnstile + honeypot, sekrety w zmiennych Cloudflare |
| Odbudowa | webhook Sanity → Cloudflare Deploy Hook | patrz faza 6 |
| Analityka | Cloudflare Web Analytics (bezcookiesowa) | zweryfikuj dostępność w planie darmowym |
| Obrazy | `next/image` z własnym loaderem → `@sanity/image-url` | `auto=format`, szerokości 480/768/1200/1800, LQIP jako blur |

Dlaczego statyczny eksport: Sanity jest odpytywane tylko podczas builda, więc ruch czytelników nie zużywa limitów API, a strony to pliki statyczne (nielimitowane na Cloudflare). Konsekwencje, które musisz obsłużyć: brak Server Actions, brak ISR, brak domyślnej optymalizacji obrazów Next.js (stąd własny loader), brak wbudowanego i18n routingu Next.js.

## 3. Limity wpisane w architekturę (stan: wrzesień 2026, zweryfikuj)

- **Cloudflare Pages**: żądania do zasobów statycznych są bezpłatne i nielimitowane. Pages Functions liczą się do limitów Workers Free: 100 000 żądań/dzień, 10 ms CPU na żądanie, 50 subrequestów. Plan darmowy: 500 buildów/miesiąc. Workers Paid: $5/mies. minimum, 10 mln żądań i 30 mln ms CPU w cenie, potem $0,30 za milion żądań i $0,02 za milion ms CPU.
- **Kierunek Cloudflare**: dla nowych projektów zalecane są Workers ze static assets; Pages jest nadal wspierane, ale rozwój idzie w Workers. Dlatego build ma być niezależny od hosta.
- **Sanity Free**: po osiągnięciu 100% limitu API/CDN/bandwidth publiczne API jest blokowane. Bandwidth obejmuje ruch obrazów. Źródła podają różne liczby limitów, więc sprawdź `sanity.io/pricing` i zapisz aktualne wartości w `docs/LIMITS.md`.
- **Resend Free**: 3 000 maili/miesiąc, 100/dzień. Wystarczy na formularz kontaktowy, nie na newsletter.

Konsekwencje projektowe:
1. Jedna publikacja w Studio = jeden build. W webhooku Sanity filtruj tylko zmiany opublikowane (bez `drafts.`), a w Cloudflare unikaj serii buildów (nie publikuj hurtowo w pętli).
2. Obrazy idą z `cdn.sanity.io` i zużywają bandwidth Sanity. Na start: wąski zestaw szerokości, jakość ~75, długi cache. W `docs/LIMITS.md` opisz plan awaryjny: własna subdomena `img.` przed `cdn.sanity.io` z cache na Cloudflare.
3. Limit plików na deployment w Pages jest skończony (zweryfikuj wartość dla planu darmowego). Nie generuj tysięcy wariantów obrazów do `out/`.

## 4. Struktura repo

```
/studio                      # dostarczone: Sanity Studio (schematy, konfiguracja, structure)
/web
  app/[locale]/…             # strony (sekcja 5)
  components/                # design system
  lib/sanity/queries.ts      # dostarczone: zapytania GROQ
  lib/sanity/client.ts       # klient (perspective: 'published')
  lib/i18n/                  # locales, słowniki UI, mapa segmentów URL
  functions/api/contact.ts   # Pages Function
  public/                    # mapa SVG, favicony
/docs                        # DECISIONS.md, LIMITS.md
```

Pnpm workspace z dwoma pakietami: `studio` i `web`.

## 5. Routing i URL

Segmenty tłumaczone (mapa w `lib/i18n`), slugi działów pochodzą z Sanity (`category.slugs`).

| Widok | PL | EN |
|---|---|---|
| Strona główna | `/pl/` | `/en/` |
| Dział | `/pl/kulinaria/` | `/en/food/` |
| Artykuł | `/pl/kulinaria/{slug}/` | `/en/food/{slug}/` |
| Mapa i Atlas | `/pl/atlas/` | `/en/atlas/` |
| Miejsce | `/pl/atlas/miejsca/{slug}/` | `/en/atlas/places/{slug}/` |
| Osoba | `/pl/atlas/ludzie/{slug}/` | `/en/atlas/people/{slug}/` |
| Produkt | `/pl/atlas/produkty/{slug}/` | `/en/atlas/products/{slug}/` |
| Nocleg | `/pl/atlas/noclegi/{slug}/` | `/en/atlas/stays/{slug}/` |
| Doświadczenie | `/pl/atlas/doswiadczenia/{slug}/` | `/en/atlas/experiences/{slug}/` |
| O projekcie | `/pl/o-projekcie/` | `/en/about/` |
| Kontakt | `/pl/kontakt/` | `/en/contact/` |

Encje mają wspólny slug we wszystkich językach; artykuły mają slug per język.

Treść stron **O projekcie** i **Kontakt** (wymaganych w założeniach projektu) trzymaj w repo: `web/content/about.pl.md`, `about.en.md`, `contact.pl.md`, `contact.en.md` (Markdown renderowany w buildzie). O projekcie opisuje misję, politykę redakcyjną i ujawnienia afiliacyjne; Kontakt zawiera formularz z fazy 4. Migracja do Sanity dopiero w wersji 2.

SEO: `<link rel="alternate" hreflang>` z `translations` artykułu (plus `x-default` na `pl`), canonical, `sitemap.xml` generowany w buildzie z `sitemapQuery`, `robots.txt`. Przełącznik języka prowadzi do tłumaczenia bieżącej strony; gdy go nie ma, do strony głównej drugiego języka (nie do 404).

## 5a. Tagi i automatyczne powiązania (decyzja zamknięta)

Redakcja **nie łączy dokumentów ręcznie para po parze**. Redaktor tylko poprawnie taguje treść, a bloki powiązań liczą się same w buildzie.

**Model.** Nowy typ dokumentu `tag` (nazwa wielojęzyczna, slug wspólny dla języków, opcjonalny `kind`: `theme` / `region` / `era`). Pole `tags: reference[]` dodaj do `article` oraz do wszystkich encji (`place`, `person`, `product`, `hotel`, `experience`). Istniejące referencje (`category`, `location[]`, `people[]`, `products[]`, `experiences[]`, `hotel[]`) **zostają** i są drugim, mocniejszym sygnałem powiązania — nie zastępuj ich tagami.

**Blok „Polecane / Powiązane”.** Jeden komponent, wspólny dla stron artykułu i encji:
- kandydatami są dokumenty dzielące z bieżącym co najmniej jeden tag **lub** co najmniej jedną referencję (ten sam `place`, `person`, `product`, `hotel`, `experience`, `category`);
- bieżący dokument i dokumenty bez tłumaczenia w bieżącym języku są odfiltrowane;
- **kolejność: najnowsze najpierw** (`publishedAt desc`; encje bez `publishedAt` sortuj po `_createdAt`);
- limit domyślnie 6, z `slice` w zapytaniu;
- gdy kandydatów brak, blok się nie renderuje (żadnych pustych nagłówków).

**Implementacja.** Zapytanie GROQ wykonywane w buildzie (SSG), bez zapytań z przeglądarki i bez przycisku w Studio. Dodaj je do `web/lib/sanity/queries.ts` jako `relatedQuery` obok istniejących zapytań (nie przepisuj pozostałych, patrz zasada 7 w sekcji 0). Opcjonalne pole `pinnedRelated: reference[]` na `article` pozwala redakcji wypchnąć na górę ręcznie wybrane pozycje; reszta listy pozostaje automatyczna.

*AC*: na seedzie artykuł z dwoma wspólnymi tagami pokazuje powiązane pozycje w kolejności od najnowszej; usunięcie tagów w Studio i rebuild usuwa blok.

## 6. Fazy i kryteria akceptacji

**Faza 0. Fundamenty.** Workspace, Next.js + Tailwind, Studio wdrożone (`sanity deploy`), CORS dla domeny i localhost, CI (typecheck, lint, build). *AC*: `pnpm build` przechodzi; w Studio da się dodać artykuł PL i jego tłumaczenie EN przyciskiem „Add translation”.

**Faza 1. Design system.** Tokeny (kolory jako zmienne CSS dla trybu jasnego i ciemnego, typografia, odstępy). Przełącznik motywu bez „flash”: skrypt inline czyta `localStorage`, a gdy brak wyboru, `prefers-color-scheme`. Komponenty: Header, Footer, Container, Prose (Portable Text z `entityLink`), ArticleCard, Figure, LanguageSwitcher, ThemeToggle. *AC*: kontrast AA w obu motywach, nawigacja klawiaturą, Lighthouse a11y ≥ 95.

**Faza 2. Model i dane.** Typ `tag` i pola `tags` na artykule oraz encjach (sekcja 5a), pola afiliacyjne na encjach (sekcja 12), lista języków jako jedno źródło prawdy (sekcja 1). Skrypt seed (NDJSON, `sanity dataset import`): 6 działów z slugami PL/EN, hierarchia miejsc (min. jeden region → miasto → wieś), zestaw tagów, po 2 artykuły w PL i EN z relacjami i tagami. Typegen (`sanity typegen`) w CI. *AC*: każde zapytanie z `queries.ts` zwraca dane na seedzie; dodanie `de` do listy języków nie wywraca typegenu.

**Faza 3. Strony.** Home według sekcji 7 (wordmark wjeżdżający do headera, hasło rozsuwające się na trzy kolumny, opowieści, działy, mapa, wyszukiwarka Pagefind), dział z paginacją, artykuł (hero, Prose, galeria, kafle Miejsca/Ludzie/Produkty/Noclegi/Doświadczenia, „Powiązane” + „Podobne”), strony Atlasu, mapa, „O projekcie”, „Kontakt”, **Polityka prywatności i Polityka cookies** (sekcja 14, warstwa 1). Blok „Polecane / Powiązane” według sekcji 5a oraz pusty `<AdSlot variant="in-feed" />` w feedach według sekcji 13. *AC*: każda strona buduje się dla PL i EN; brak martwych linków (test crawlera na `out/`); blok powiązań pokazuje najnowsze pozycje i znika, gdy kandydatów brak.

**Faza 4. Kontakt.** Formularz + Pages Function + Resend + Turnstile + honeypot, walidacja po stronie funkcji, obsługa limitu 100 maili/dzień (czytelny komunikat, nie 500). Domena nadawcy z SPF/DKIM. *AC*: test end-to-end z dostarczonym mailem; błędne żądania odrzucane.

**Faza 5. SEO i wydajność.** JSON-LD: Article, Person, Place, LodgingBusiness, Recipe (gdy `format == 'recipe'`). Obraz OG = `heroImage` przycięty do 1200×630 przez URL Sanity. Budżet: LCP < 2,5 s (mobile, 4G), CLS < 0,05, JS na stronie artykułu < 120 kB gzip. *AC*: raport Lighthouse w obu motywach zapisany w `docs/`.

**Faza 6. Wdrożenie.** Projekt Cloudflare Pages (root `web`, build `pnpm --filter web build`, output `out`, `NODE_VERSION` ustawione), zmienne środowiskowe, Deploy Hook, webhook Sanity z filtrem GROQ na typy `article`, `place`, `person`, `product`, `hotel`, `experience`, `category`, domena, Web Analytics. Podgląd szkiców w wersji 1.0: `sanity dev` lokalnie i branch deploy na Pages. *AC*: publikacja w Studio pojawia się na żywej stronie w czasie ≤ 5 minut.

**Faza 7. Warstwa zgód (zbudowana, wyłączona).** `ConsentProvider`, `useConsent()`, integracja certyfikowanego CMP, Consent Mode v2 z domyślnym `denied`, `public/ads.txt` z placeholderem, flaga `NEXT_PUBLIC_ADS_ENABLED=false`, `docs/PRIVACY.md`. *AC*: przy fladze `false` strona nie wysyła żadnego żądania do domen Google ani partnerów (test Playwright na `out/`); przy `true` pojawia się baner, a skrypty ładują się dopiero po akceptacji.

## 7. Layout i design (wzorowany na sasaki.com)

Wzorujemy się na **strukturze, proporcjach i zachowaniu** strony sasaki.com, nie kopiujemy jej kodu, grafik, tekstów ani logo. Opis poniżej powstał ze zrzutów ekranu trzech stanów strony (start, po przewinięciu, sekcja „Voices”). Działający prototyp: `docs/prototype/sardigna-home-prototype.html`. **Prototyp jest wzorcem geometrii i zachowania; przenieś go do komponentów zamiast przepisywać logikę.** Wymiary poniżej to wartości względne (vw/vh) zmierzone na oknie ok. 1210 × 673 px.

### 7.1 Napis na froncie

Hasło marki to **`Su Mari. S'Isula. Sa Bida.`** (po sardyjsku: morze, wyspa, życie). **Nie tłumaczymy go**, jest identyczne w PL i EN, pisownia dokładnie jak w briefie. Składa się z dwóch warstw: kolorowego znaku `SARDIGNA.` (wordmark) i trzech rzeczowników hasła pod nim. Pełny tekst `SARDIGNA. Su Mari. S'Isula. Sa Bida.` jest w ukrytym `<h1 class="sr">`, a elementy wizualne mają `aria-hidden`. Opcjonalna linia tłumaczeniowa (PL „Morze. Wyspa. Życie.”, EN „The sea. The island. Life.”) do potwierdzenia przez właściciela.

### 7.2 Stan startowy (scroll = 0)

- Białe tło, pełny ekran. **Header stały** (wysokość ok. 100 px, marginesy boczne 2,9vw): po lewej nawigacja tekstowa (Journal, Atlas, Ludzie, O projekcie + opcjonalna emoji-ikona „Nowość”), po prawej wyszukiwarka („Szukaj na wyspie”: pole z cienką linią pod spodem, font szeryfowy, lupa) i przełącznik języka (EN/PL), obok przełącznik motywu.
- **Środek ekranu (ok. 44vh): duży wordmark** o szerokości ok. 48vw (max 640 px). Litery są wielokolorowe: każda litera dzieli się na 2-3 poziome pasy w kolorach palety (terakota, ochra, kobalt, mirt, cannonau, granit, piasek, morze).
- Pod znakiem (ok. 60vh) w jednej linii hasło `Su Mari.` `S'Isula.` `Sa Bida.` (ok. 3vw, grotesk, waga 400). **Każdy rzeczownik (z kropką) ma własne cienkie podkreślenie** (1 px, jasnoszare) i są rozdzielone odstępem, nie jednym ciągłym podkreśleniem.

### 7.3 Animacja hero (kluczowa mechanika)

To jest jedna animacja sterowana scrollem, nie sekwencja kroków:

1. **Wordmark przemieszcza się z centrum ekranu do środka headera** i zmniejsza do ok. 1/5 rozmiaru (docelowo ok. 116-165 px szerokości). Nie jest osobnym elementem: jest znakiem w headerze, który na starcie ma transformację `translate + scale`. Po animacji zostaje w headerze na całej stronie.
2. **Trzy słowa hasła rozsuwają się na trzy kolumny** (technika FLIP): każde słowo leży w DOM w swoim docelowym miejscu (nagłówek kolumny), a na starcie jest przesunięte transformacją do pozycji „linii hasła”. Przesunięcia liczysz z pomiaru elementu-widma (`.ghost`, ukryty, ten sam font), a nie z wartości na sztywno. Pomiar powtarzaj po `document.fonts.ready` i przy `resize`. **Kropka po rzeczowniku** (`Su Mari.`) jest osobnym elementem, który znika wraz z postępem animacji (`max-width` i `opacity` od pełnej wartości do 0), więc w nagłówku kolumny słowo jest bez kropki, a jego podkreślenie skraca się do szerokości samego słowa.
3. **Po dotarciu słów na miejsce** (ok. 50-75% postępu) pojawiają się (fade + 14 px w górę) akapit i lista linków każdej kolumny.
4. Postęp: `p = scrollY / travel`, gdzie `travel = 100vh` to dystans, na którym scena jest „przyklejona”. Scena wewnątrz hero to `position: sticky`, a jej wysokość wynika **z zawartości**: `stageHeight = max(100vh, dolna krawędź kolumn + 6vh)`, `top = min(0, 100vh − stageHeight)` (przy niskich oknach dół kolumn zostaje widoczny), a `height` hero = `stageHeight + travel`. Animacja zamyka się przy `p ≈ 0,55` z easingiem `easeInOutCubic`, tekst pojawia się do `p ≈ 0,75`, a reszta travel to pauza z ustalonym układem. Liczenie wykonuj w `measure()` (po `document.fonts.ready`, przy `resize` i zmianie `prefers-reduced-motion`).
5. Tylko `transform` i `opacity`, aktualizacja w `requestAnimationFrame`, `scroll` z `passive: true`, zero obrazów w hero.
6. **Statyczny fallback** (bez JS, `prefers-reduced-motion: reduce`, szerokość < 900 px): brak sticky i brak wysokości hero liczonej z zawartości, znak jest mały w headerze, kolumny to zwykła treść (1 kolumna na mobile), akapity i linki widoczne od razu.
7. **Gwarancja układu (błąd, który już raz wystąpił):** sekcja „Opowieści” (`.voices`) jest **rodzeństwem** `.hero`, nigdy jego dzieckiem, a kolumny (`.cols`) mieszczą się w całości w scenie. Dzięki temu żaden obraz nie wjedzie na akapity i linki, zanim będą w pełni widoczne (`opacity = 1`). Dodaj test Playwright (Chromium): dla okien 1210×420, 1210×540, 1210×700 i 1600×900 przewijaj co 20 px; jeśli którykolwiek `.voices .ph` ma `top < wysokość okna`, to wszystkie `.cols .txt` muszą mieć `opacity = 1`, a dół `.cols .links` musi leżeć nad górą obrazu. Test ma przechodzić w CI.

### 7.4 Stan po animacji: trzy kolumny

Trzy równe kolumny (start co ok. 32,5vw, odstęp ok. 3,5vw), kolumny lekko schodkowo względem siebie (przesunięcie 0 / 4 / 8 px). W każdej: nagłówek (to samo słowo, podkreślone), akapit szeryfowy w wadze 300, jasnoszary, max ok. 26 em szerokości, potem lista linków (grotesk, jasnoszare, każdy link z cienkim podkreśleniem, odstęp ok. 0,9 em).

| Kolumna | Akapit (2 zdania, do redakcji) | Linki |
|---|---|---|
| `Su Mari` | wybrzeże, które ukształtowało kuchnię i rytm dni | Wybrzeże (Atlas, `place.kind = coast`), Hotele, Doświadczenia |
| `S'Isula` | wyspa czytana region po regionie, aż po wieś | Atlas, Miejsca, Historia |
| `Sa Bida` | rzeczy, które zostały na życie, i ludzie, którzy je robią | Kulinaria & produkty, Rękodzieło, Ludzie |

Treść trzech kolumn trzymaj w `web/content/home.pl.json` i `home.en.json` (migracja do Sanity w wersji 2).

### 7.5 Sekcja „Opowieści” (odpowiednik „Voices”)

Dwie kolumny kart, marginesy ok. 8,3vw po bokach i odstęp ok. 8,4vw. Karty nie mają ramek ani zaokrągleń. Zdjęcie każdej karty ma **inne proporcje** (lewa ok. 1,93:1, prawa ok. 2,27:1; kadr z hotspotu Sanity), tytuł jest podkreślony, kategoria stoi po prawej stronie tej samej linii w kolorze jasnoszarym, poniżej zajawka w kolorze podstawowym. Pod nimi jedno **szerokie zdjęcie panoramiczne** (ok. 2,4:1) z marginesami ok. 11vw. Dalej kolejne pary kart i szerokie zdjęcia (dane: `homeQuery.latest`, potem działy z `homeQuery.categories`).

### 7.6 Typografia i kolor

- **Grotesk** (nawigacja, hasło, nagłówki kolumn, tytuły kart, linki): Hanken Grotesk (lub inny bezpłatny odpowiednik), waga 400/500. Hasło i nagłówki kolumn `clamp(28px, 3vw, 52px)`, nawigacja 15 px, tytuły kart `clamp(17px, 1.35vw, 22px)`.
- **Szeryf lekki** (akapity kolumn, pole wyszukiwania): Newsreader 300, `clamp(16px, 1.3vw, 20px)`, interlinia 1,45.
- **Kolor**: jasny: tło `#fff`, tekst `#222`, szary `#9a9a9a`, linie `#d4d4d4`; ciemny: `#121212` / `#eee` / `#8a8a8a` / `#3a3a3a`. Kolory znaku zostają w obu motywach. Motyw: `prefers-color-scheme` + ręczny przełącznik (`localStorage` w `try/catch`), bez „flash”.
- **Wordmark**: w prototypie jest tekstem z gradientami o twardych granicach (`background-clip: text`), co daje litery „pocięte” na kolorowe pasy bez SVG. Docelowo można zastąpić własnym SVG, ale zachowaj zasadę pasów i paletę. Nie odtwarzaj kształtów liter ani kolorów logo Sasaki.
- **Wyszukiwarka**: Pagefind (bezpłatny, statyczny indeks generowany po buildzie, obsługuje wiele języków), UI w stylu pola z headera; wynik po Enter/lupie. Filtr języka = język strony.
- **Ujawnienia**: linki afiliacyjne z `rel="sponsored noopener"` i widoczną etykietą (`hotel.isAffiliate` / `isSponsored`) — pełne zasady w sekcji 12.

### 7.7 Kolejność sekcji strony głównej

Header → hero (7.2-7.4) → Opowieści (7.5) → sekcje działów → mapa Explore (inline SVG, patrz niżej) → footer (hasło marki jako duży napis, linki, „Do góry”).

**Mapa Explore**: inline SVG Sardynii (własne uproszczenie lub dane na wolnej licencji, sprawdź licencję), regiony klikalne po `place.mapId`, tooltip z liczbą artykułów, obsługa klawiatury. Bez Mapbox/Leaflet.

## 8. Wymagania niefunkcjonalne

- Dostępność WCAG 2.2 AA.
- Prywatność (PL/UE): wersja 1.0 startuje **bez cookies i bez banera zgód** (szczegóły i warstwy w sekcji 14); przy formularzu krótka informacja o przetwarzaniu danych.
- Alt wymagany dla każdego zdjęcia (walidacja w Studio już to wymusza).
- Treść bez JavaScriptu: artykuły, nawigacja i hero (statyczny fallback, patrz 7.3) działają bez JS; przełącznik motywu i mapa mają wersję zastępczą.

## 9. Zmienne środowiskowe

```
# Studio
SANITY_STUDIO_PROJECT_ID=
SANITY_STUDIO_DATASET=production
SANITY_STUDIO_HOST=            # nazwa dla *.sanity.studio

# Web (build)
SANITY_PROJECT_ID=
SANITY_DATASET=production
SANITY_API_VERSION=2025-02-19
NEXT_PUBLIC_SITE_URL=

# Reklamy i zgody (sekcje 13-14) — w wersji 1.0 zostawione puste / false
NEXT_PUBLIC_ADS_ENABLED=false
NEXT_PUBLIC_ADSENSE_CLIENT=     # ca-pub-… , uzupełnić dopiero przy włączeniu
NEXT_PUBLIC_CMP_ID=             # identyfikator certyfikowanego CMP

# Pages Function (sekrety Cloudflare)
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

## 10. Definition of Done (wersja 1.0)

- Wszystkie fazy zaliczone, `pnpm build` zielony w CI.
- Strona działa po PL i EN, oba motywy, brak błędów w konsoli.
- Redaktor bez pomocy dewelopera dodaje artykuł, tłumaczenie, miejsce i osobę, a strona się aktualizuje.
- Blok „Polecane / Powiązane” generuje się z tagów i referencji, sortowany od najnowszych, bez ręcznego łączenia dokumentów.
- Wersja 1.0 nie ustawia żadnego cookie i nie pokazuje banera zgód; sloty In-Feed, `ads.txt` i gatekeeper CMP są na miejscu, ale wyłączone.
- Dodanie `de` do listy języków buduje kompletne ścieżki `/de/…` bez zmian w komponentach.
- `docs/DECISIONS.md`, `docs/LIMITS.md` i `docs/PRIVACY.md` uzupełnione, z datą weryfikacji limitów.

## 11. Pytania do właściciela (zadaj przed fazą 0, jeśli brak odpowiedzi)

1. Docelowa domena i nazwa marki (robocza: „Sardigna Atlas”, znak: SARDIGNA.).
2. Skąd pochodzą zdjęcia (własne, licencjonowane, wolna licencja) i kto jest ich autorem.
3. Ile osób będzie edytować w Studio (limity miejsc w planie Sanity).
4. Identyfikatory programów afiliacyjnych i wybór sieci (Awin / CJ Affiliate) — potrzebne dopiero do uzupełnienia treści, nie do builda.
5. Czy potwierdzasz opcjonalną linię tłumaczeniową hasła (PL „Morze. Wyspa. Życie.”, EN „The sea. The island. Life.”).

> Pytanie o linki afiliacyjne jest już **rozstrzygnięte**: tak, od startu (sekcja 12).

## 12. Afiliacja (decyzja zamknięta, monetyzacja wersji 1.0)

Linki afiliacyjne są jedyną monetyzacją w wersji 1.0. Zasady techniczne:

- każdy dokument encji (`hotel`, `experience`, `product`, `restaurant`) przechowuje **własny `affiliateUrl`** plus `affiliateNetwork` (string) — szablon nie wie i nie musi wiedzieć, z jakiej sieci pochodzi link;
- **tylko zwykłe linki**, żadnych osadzanych widgetów, wyszukiwarek cen ani iframe'ów partnerów w wersji 1.0 — widgety ustawiają cookies third-party na naszej domenie i wpadają do warstwy 3 z sekcji 14;
- `rel="sponsored noopener"`, `target="_blank"`, widoczna etykieta przy linku (`hotel.isAffiliate` / `isSponsored`) oraz ujawnienie afiliacyjne na początku artykułu, który takie linki zawiera;
- `affiliateUrl` waliduj w Studio (poprawny URL, schemat `https`).

Mapa źródeł na typy treści (do treści „O projekcie” i do `docs/DECISIONS.md`):

| Typ treści | Źródła afiliacji |
|---|---|
| Noclegi, hotele, agriturismo | Booking.com, Expedia, Agoda, ewentualnie umowy bezpośrednie z obiektami |
| Doświadczenia, tury, rejsy | GetYourGuide, Viator |
| Restauracje | TheFork (prowizja za zrealizowaną rezerwację) |
| Jedzenie i produkty regionalne, rękodzieło | wyspecjalizowani sprzedawcy produktów włoskich, umowy bezpośrednie z producentami |

**Amazon jest wykluczony.** Nie dodawaj go do schematów, seedów, przykładów, dokumentacji ani podpowiedzi w Studio.

Rekomendacja operacyjna (nie wpływa na kod): przystąpienie do jednej sieci afiliacyjnej — Awin lub CJ Affiliate — żeby zarządzać wieloma markami z jednego panelu.

## 13. Miejsce na reklamę AdSense In-Feed (przygotowane, wyłączone)

Format: **In-Feed**, czyli sloty **między kartami artykułów w feedzie** (strona główna, strony działów, listy wyników). Bez In-Article, bez display w treści artykułu.

Wymagania:
- komponent `<AdSlot variant="in-feed" />` wstawiany w listę kart co N pozycji (domyślnie N = 6, wartość w konfiguracji), wyglądem zgodny z kartą: brak ramek i zaokrągleń, ta sama siatka, ta sama typografia;
- slot **rezerwuje stałą wysokość** (`min-height`, `aspect-ratio`), żeby włączenie reklam nie zepsuło budżetu CLS < 0,05 z fazy 5;
- w wersji 1.0 slot **nie ładuje żadnego skryptu**: jest pusty, niewidoczny (`display: none` przy wyłączonej fladze) i sterowany flagą `NEXT_PUBLIC_ADS_ENABLED` (domyślnie `false`);
- plik `public/ads.txt` obecny od początku, z `[PLACEHOLDER]` zamiast identyfikatora wydawcy;
- skrypt AdSense i `data-ad-client` ładowane **wyłącznie** przez gatekeeper z sekcji 14, nigdy bezpośrednio w layoucie;
- `aria-hidden` i brak wpływu na kolejność czytania, gdy slot jest pusty.

*AC*: przy `NEXT_PUBLIC_ADS_ENABLED=false` strona nie wysyła żadnego żądania do domen Google, a layout feedu jest identyczny jak przy `true` z pustym slotem.

## 14. Zgody, cookies i GDPR — trzy warstwy (decyzja zamknięta)

Zasada nadrzędna, obowiązująca w całym kodzie: **żaden skrypt ustawiający cookie ani przetwarzający dane osobowe nie ładuje się przed zgodą**, a jedynym miejscem, które go ładuje, jest gatekeeper z warstwy 2.

**Warstwa 1 — baza wersji 1.0, bez banera.**
- zwykłe linki afiliacyjne z identyfikatorem (sekcja 12), bez widgetów partnerów;
- brak Google Analytics, brak AdSense, brak cookies analitycznych; analityka wyłącznie bezcookiesowa (Cloudflare Web Analytics);
- statyczne strony **Polityka prywatności** (`/pl/polityka-prywatnosci/`, `/en/privacy-policy/`) i **Polityka cookies** (`/pl/polityka-cookies/`, `/en/cookie-policy/`), treść w `web/content/` obok `about` i `contact`, linki w footerze;
- informacja o linkach afiliacyjnych: zdanie w polityce prywatności i ujawnienie w artykułach, które je zawierają.

**Warstwa 2 — infrastruktura zgód, zbudowana i uśpiona.**
- certyfikowany CMP (Google-certified, zgodny z TCF v2.2 — wymóg AdSense w UE) zintegrowany z layoutem, ale **nieaktywny**, dopóki żadna usługa z warstwy 3 nie jest włączona;
- `ConsentProvider` + hook `useConsent()` jako jedyny interfejs: komponent nigdy nie wstawia obcego `<script>` sam z siebie;
- kategorie zgód: `necessary`, `analytics`, `advertising`; stan przechowywany po stronie CMP, nie w naszym `localStorage`;
- przy `NEXT_PUBLIC_ADS_ENABLED=false` i braku Analytics CMP **nie renderuje się wcale** — żadnego banera na stronie startowej.

**Warstwa 3 — usługi za zgodą.**
- Google Analytics, AdSense In-Feed oraz ewentualne widgety Booking / GetYourGuide ładowane **dopiero** po zgodzie odpowiedniej kategorii;
- **Google Consent Mode v2** skonfigurowany z domyślnym stanem `denied` dla `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`;
- każda nowa usługa third-party przechodzi przez gatekeeper — dodanie jej z pominięciem `useConsent()` traktuj jako błąd i zapisz w `docs/DECISIONS.md`, jeśli musisz zrobić wyjątek.

Udokumentuj całość w `docs/PRIVACY.md`: które usługi, która kategoria zgody, jaki cookie, jaki okres. To nie jest porada prawna — w `docs/PRIVACY.md` dopisz notatkę, że przed uruchomieniem komercyjnym treść polityk powinien sprawdzić prawnik znający prawo polskie i unijne.

*AC*: build wersji 1.0 nie zawiera żadnego żądania do `googletagmanager.com`, `googlesyndication.com` ani domen partnerów (test w Playwright na `out/`); przełączenie flagi reklam renderuje baner CMP i dopiero po akceptacji wysyła żądania.
