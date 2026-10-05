# Wdrożenie i operacje

Hosting: **wyłącznie Cloudflare** (Pages, git-connected; zero Vercela). Strona to pełny eksport statyczny (`web/out`), Sanity jest odpytywane tylko w czasie buildu.

## Architektura

```
Studio (sardigna-atlas.sanity.studio) --publikacja--> Sanity (projekt rkr99tu3, dataset production)
   └─ webhook "cloudflare-pages-rebuild" (tylko opublikowane dokumenty) ─POST─> Cloudflare Deploy Hook
        └─ build w Pages: pnpm --filter web build → web/out → https://mysardinia.online
GitHub (pavuloncool/sardigna-atlas, main) --push--> Cloudflare Pages (build produkcyjny); inne gałęzie = podgląd
```

## Projekt Cloudflare Pages `sardigna-atlas`

| Ustawienie | Wartość |
|---|---|
| Repozytorium / gałąź produkcyjna | `pavuloncool/sardigna-atlas` / `main` |
| Katalog główny / komenda buildu / wyjście | `web` / `pnpm --filter web build` / `out` |
| Funkcje | `web/functions/` (np. `/api/contact`), kod wspólny w `functions/_lib/` |
| Podglądy (preview) | każda gałąź i PR dostaje `https://<gałąź>.sardigna-atlas.pages.dev` (z `X-Robots-Tag: noindex`) |
| Domena | `mysardinia.online` (CNAME `@` → `sardigna-atlas.pages.dev`, Proxied); `www` → przekierowanie 301 na domenę główną (Redirect Rule) |
| Przekierowanie `/` | `web/public/_redirects`: `/ → /pl/` (302) |

### Zmienne środowiskowe (Pages → Settings → Variables and Secrets)

| Zmienna | Typ | Uwagi |
|---|---|---|
| `NODE_VERSION`=22, `PNPM_VERSION`=10.33.2 | tekst | build image v3 ma domyślnie pnpm 10.11.1 i nie czyta wersji z lockfile |
| `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION` | tekst | dane budowania |
| `NEXT_PUBLIC_SITE_URL`=`https://mysardinia.online` | tekst | canonical, sitemap, OG (tylko production) |
| `NEXT_PUBLIC_ADS_ENABLED`=`false` | tekst | reklamy wyłączone w v1.0 |
| `NEXT_PUBLIC_HERO_IMAGE`=`false` | tekst | zdjęcie w tle hero wyłączone (usunięcie zmiennej je włącza) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | tekst | klucz publiczny widgetu |
| `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY` | **secret** | nigdy w repo ani w czacie |
| `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | tekst | adres odbiorcy i nadawcy (`@mail.mysardinia.online`) |

Zmiany zmiennych działają od następnego wdrożenia.

## Publikacja treści: Sanity → Deploy Hook

- **Webhook Sanity** `cloudflare-pages-rebuild` (dataset `production`, POST) na zdarzenia create/update/delete dokumentów typów: `article`, `place`, `person`, `product`, `hotel`, `experience`, `restaurant`, `brand`, `author`, `category`, `tag`, `translation.metadata`. Filtr wyklucza szkice: `!(_id in path("drafts.**"))`, więc klikanie w Studio bez publikacji nic nie buduje.
- **Deploy Hook** `sanity-publish` (gałąź `main`). Jego URL jest sekretem (daje prawo uruchamiania buildów): nie ma go w repozytorium. Gdyby wyciekł: usuń hook w Pages → Settings → Builds, utwórz nowy i przepisz webhook skryptem poniżej.
- **Odtworzenie / aktualizacja webhooka** (idempotentne): z folderu `studio`  
  `DEPLOY_HOOK_URL="<URL hooka>" pnpm exec sanity exec scripts/create-webhook.ts --with-user-token`
- **Zmierzone (2026-10-05):** zmiana opublikowana w Sanity była widoczna na produkcji po **75 s**, a jej cofnięcie po 55 s (kryterium z briefu: ≤ 5 min).
- **Diagnostyka:** dostawy webhooka: `pnpm exec sanity hooks logs` (w `studio`); buildy: Pages → Deployments.

### Uwaga na liczbę buildów

Pages Free: **500 buildów/mies., jeden naraz**. Webhook odpala build **na każdy opublikowany dokument**, więc hurtowa publikacja N dokumentów da N buildów w kolejce. Zasady: nie publikuj w pętli ani skryptem po jednym dokumencie; przy dużych importach (np. `sanity datasets import`) usuń na czas importu webhook (`sanity hooks delete`), a po zakończeniu uruchom jeden build ręcznie (Pages → Deployments → Retry/Create deployment) i przywróć webhook skryptem. Poza tym seed i zmiany schematu nie wymagają webhooka.

## Podgląd szkiców (wersja 1.0)

Szkice są widoczne wyłącznie w Studio (`pnpm studio` lokalnie albo hostowane Studio); strona czyta perspektywę `published`. Podgląd zmian w kodzie i układzie: wypchnij gałąź, a Pages zbuduje podgląd pod adresem gałęzi. Podgląd szkiców na stronie (Presentation / Live Preview) jest poza wersją 1.0.

## Web Analytics (cookieless)

Włączone 2026-10-05 w panelu: Workers & Pages → `sardigna-atlas` → **Metrics** → Web Analytics → **Enable**. Cloudflare wstrzykuje przy wdrożeniu `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=…>`; dane wysyła na `cloudflareinsights.com`. To jedyna dopuszczona analityka (sekcja 14 briefu, warstwa 1: bez cookies i bez banera).

**Sprawdzone na produkcji po włączeniu:** `document.cookie` pusty, `localStorage`/`sessionStorage`/IndexedDB puste, odpowiedzi skryptu i strony bez `Set-Cookie`, żadnych domen Google ani partnerów (hosty: własna domena, `static.cloudflareinsights.com`, `cloudflareinsights.com`, `cdn.sanity.io`). Nie da się z poziomu JS zobaczyć ewentualnych cookies ustawianych przez domenę `cloudflareinsights.com` na odpowiedzi POST beacona; dokumentacja Cloudflare opisuje Web Analytics jako bezcookiesową, a przed uruchomieniem komercyjnym warto to potwierdzić w narzędziach przeglądarki (zakładka Aplikacja → Cookies). Uwaga z dokumentacji: nagłówek `Cache-Control: public, no-transform` wyłączałby automatyczne wstrzykiwanie skryptu (nie ustawiamy takiego).

## Wariant „Workers static assets” (przenośność)

`web/wrangler.workers.jsonc` + `web/worker/index.ts` opisują ten sam serwis jako Worker z zasobami z `out/` i trasą `/api/contact`. **Plik nie nazywa się `wrangler.jsonc` celowo**: sprawdzone na podglądzie gałęzi, że wykryty `wrangler.jsonc` w katalogu projektu wyłącza funkcje Pages (`/api/contact` przestaje działać). Wdrożenie wariantu (z `web`, po buildzie): `pnpm dlx wrangler@latest deploy -c wrangler.workers.jsonc` (konfigurację sprawdzono `--dry-run`, wariantu nie wdrażano).

## Wycofanie zmiany

Pages → Deployments → wybierz poprzednie udane wdrożenie → **Rollback to this deployment**. Rollback nie zmienia treści w Sanity.

## CORS

Strona nie odpytuje Sanity z przeglądarki (dane tylko w buildzie), więc CORS dla `mysardinia.online` nie jest potrzebny. Lokalnie `http://localhost:3000` jest dodany do CORS projektu.
