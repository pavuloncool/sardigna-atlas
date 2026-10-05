# Prywatność i zgody

> To nie jest porada prawna. Przed uruchomieniem komercyjnym (reklamy, afiliacja) treść polityk (`web/content/privacy-policy.*`, `cookie-policy.*`) powinien sprawdzić prawnik znający prawo polskie i unijne.

## Trzy warstwy (sekcja 14 briefu)

1. **Baza wersji 1.0, bez banera (działa).** Zero cookies, zero narzędzi third-party ustawiających dane. Analityka wyłącznie bezcookiesowa (Cloudflare Web Analytics). Zwykłe linki afiliacyjne (`rel="sponsored noopener"`), bez widgetów. Strony polityk w stopce.
2. **Infrastruktura zgód (zbudowana, uśpiona).** `ConsentProvider` + `useConsent()` + gatekeeper. Przy `NEXT_PUBLIC_ADS_ENABLED=false` nie istnieje w HTML ani w paczkach ładowanych przez stronę.
3. **Usługi za zgodą (wyłączone).** AdSense In-Feed, ewentualnie Google Analytics i widgety Booking/GetYourGuide. Ładują się wyłącznie przez gatekeeper, po zgodzie właściwej kategorii.

## Rejestr usług

| Usługa | Kiedy się ładuje | Kategoria zgody | Cookies / pamięć | Okres | Stan |
|---|---|---|---|---|---|
| Cloudflare Web Analytics | zawsze (wstrzykiwana przy wdrożeniu) | `necessary` (bezcookiesowa, bez profilowania) | brak (sprawdzone 2026-10-05) | — | włączona |
| Cloudflare Turnstile | dopiero po kliknięciu w formularz na stronie Kontakt | `necessary` (ochrona przed spamem) | do weryfikacji przez prawnika (zob. polityka prywatności) | — | włączona |
| Resend (wysyłka z formularza) | po stronie serwera (Pages Function), nie w przeglądarce | `necessary` | brak | — | włączona |
| Motyw jasny/ciemny | od razu | `necessary` (preferencja użytkownika) | `localStorage` klucz `theme`, tylko lokalnie | do usunięcia przez użytkownika | włączony |
| Zgody (adapter wewnętrzny) | tylko przy fladze `true` | — | `localStorage` klucz `consent.v1` (wybór) | do usunięcia przez użytkownika | wyłączone |
| Google Consent Mode v2 | tylko przy fladze `true` (kolejka `dataLayer`, bez żądań sieciowych) | steruje sygnałami `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` | brak | — | wyłączone |
| Google AdSense In-Feed | tylko przy fladze `true` i po zgodzie `advertising` | `advertising` | cookies Google (lista i okresy: wg dokumentacji Google i CMP, uzupełnić przy włączeniu) | wg Google | wyłączone |
| Google Analytics | nie zaimplementowane; dodać wyłącznie przez gatekeeper, kategoria `analytics` | `analytics` | `_ga*` (przy zgodzie) | wg Google | brak |

Kategorie: `necessary` (bez zgody), `analytics`, `advertising`.

## Jak działa warstwa 2

- `lib/consent/gatekeeper.ts` jest **jedynym** miejscem, które dokłada obcy `<script>` (`loadScript`, `loadAdsense`, `mountAdSlots`). Odmawia wstawienia skryptu dla kategorii bez zgody.
- `components/consent/ConsentProvider.tsx` udostępnia `useConsent()` (`enabled`, `decided`, `granted`, `openPreferences`). Layout renderuje go tylko przy fladze `true`; przy `false` `useConsent()` zwraca stan „wyłączone”, wszystko odrzucone.
- `components/consent/ConsentRuntime.tsx` (leniwa paczka) ustawia Consent Mode v2 na `denied` **przed** czymkolwiek innym, pyta adapter o zapisany wybór, pokazuje baner (Odrzucam i Akceptuję równorzędnie) i przekazuje wybór do Consent Mode oraz gatekeepera. Przycisk „Ustawienia zgód” w stopce (tylko przy fladze `true`) otwiera baner ponownie.
- `components/AdSlot.tsx` jest pustym slotem renderowanym przez serwer; jednostkę `<ins class="adsbygoogle">` wstawia do niego gatekeeper (`mountAdSlots`) po zgodzie `advertising`. Strona bez slotu nie ładuje skryptu AdSense.
- `lib/consent/types.ts` definiuje `ConsentAdapter` (`init`, `save`): jedyny punkt zależny od CMP.

## Adapter wewnętrzny a certyfikowany CMP (CP5)

`lib/consent/internalAdapter.ts` zapisuje wybór w `localStorage` i służy do budowy oraz testów. **Nie jest certyfikowanym CMP zgodnym z TCF 2.2**, więc nie wystarcza do serwowania reklam AdSense w EOG (wymóg Google). Brief zakłada stan po stronie CMP, nie w naszym `localStorage`. Wybór konkretnego CMP wymaga decyzji i konta właściciela, dlatego jest odłożony do checkpointu CP5.

**Włączenie reklam (CP5), kolejność:**
1. Wybrać CMP certyfikowany przez Google (TCF 2.2) i założyć konto; napisać adapter `ConsentAdapter` na jego API (podmiana `internalAdapter` w `ConsentRuntime.tsx`), ewentualnie zastąpić własny baner banerem CMP.
2. Konto AdSense, zatwierdzenie witryny, utworzenie jednostki In-Feed (slot i klucz układu).
3. W Pages ustawić: `NEXT_PUBLIC_ADS_ENABLED=true`, `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-…`, `NEXT_PUBLIC_ADSENSE_SLOT`, `NEXT_PUBLIC_ADSENSE_LAYOUT_KEY`; opcjonalnie `NEXT_PUBLIC_AD_EVERY` (domyślnie 6).
4. Wpisać prawdziwy identyfikator w `web/public/ads.txt` (`google.com, pub-…, DIRECT, f08c47fec0942fa0`).
5. Uzupełnić listę cookies i okresów w tej tabeli i w polityce cookies; przegląd prawnika.
6. Przejść `pnpm test:e2e` (w tym testy zgód) i Lighthouse (CLS < 0,05 po włączeniu slotów).

## Testy

- `tests/consent-off.spec.ts` (build produkcyjny `web/out`, flaga `false`): zero żądań do domen Google i partnerów na stronach głównych, Atlasie, autorach, politykach i artykule; brak banera, `dataLayer`, `gtag`, cookies; w paczkach JS nie ma kodu AdSense ani zgód; Turnstile pojawia się dopiero po interakcji z formularzem; `ads.txt` z placeholderem. Dozwolone hosty: własna domena, `cdn.sanity.io`, `cloudflareinsights.com` (analityka własna Cloudflare, wstrzykiwana przez Pages, lokalnie jej nie ma).
- `tests/consent-on.spec.ts` (build testowy `pnpm --filter web build:ads` → `web/out-ads`, port 4174; pomijany bez katalogu): baner jest widoczny, Consent Mode startuje jako `denied`, zero żądań do Google przed wyborem; odmowa jest zapamiętana i nie ładuje nic; akceptacja jako pierwsza wysyła żądanie po skrypt AdSense i ustawia `granted`; stopka ponownie otwiera baner.
