# Współpraca z twórcami i markami

> Dokument roboczy, nie porada prawna. Oznaczenia, teksty umów i polityki powinien sprawdzić prawnik znający prawo polskie i unijne (w tym wytyczne UOKiK dotyczące oznaczania reklamy przez twórców internetowych) przed uruchomieniem komercyjnym.

## Model

- **Twórcy kulinarni to autorzy gościnni.** Mają profil w serwisie (`/pl/autorzy/{slug}/`, `/en/authors/{slug}/`): zdjęcie, rola, bio, linki, informacja o współpracach. Treści wprowadza redakcja; **twórca nie dostaje konta w Studio.**
  - Powód: w planie Sanity Free (zweryfikowane 2026-10-05, zob. `LIMITS.md`) zewnętrzny użytkownik może mieć tylko rolę Administratora (pełny dostęp, także do cudzych treści) albo Viewera. Role Contributor i Editor są płatne. Konta twórców rozważyć dopiero przy realnej skali współpracy i płatnym planie.
- **Marki** (`brand`): producenci żywności i sprzętu kuchennego. Relacja stała (`partnership`: brak, afiliacja, sponsor, barter) jest opisana na marce, a konkretny artykuł oznacza współpracę osobno.
- **Sprzęt kuchenny / AGD** to `product` z rodzajem „Sprzęt kuchenny / AGD” i referencją do marki. Linia redakcyjna: sprzęt powiązany z potrawą lub produktem regionalnym (narzędzie do konkretnej tradycyjnej potrawy), nie sklep ani porównywarka.
- **Amazon jest wykluczony** (sekcja 12 briefu). Afiliacja AGD: programy bezpośrednie producentów, sieci Awin/CJ (dostępność programów konkretnych marek trzeba sprawdzić, nie zakładamy jej z góry), umowy z markami.

## Jak dodać (Studio)

1. **Autor gościnny:** Autor → Rodzaj „Autor gościnny / twórca”, rola, bio, zdjęcie, linki, „Informacja o współpracach autora”. Artykuł: pole Autor.
2. **Marka:** Marka → nazwa, logo, opis, strona, „Współpraca z marką”. Jeśli jest link afiliacyjny: `affiliateUrl` (https) i `affiliateNetwork`.
3. **Sprzęt:** Produkt → Rodzaj „Sprzęt kuchenny / AGD”, pole Marka, link afiliacyjny. Dodaj do pola Produkty artykułu.
4. **Oznaczenie w artykule:** pole „Współpraca (oznaczenie dla czytelnika)”:

| Wybór | Co widzi czytelnik (na początku tekstu, przed zdjęciem) |
|---|---|
| Brak | nic (chyba że artykuł zawiera link afiliacyjny) |
| Linki afiliacyjne | „Linki afiliacyjne. Ten materiał zawiera linki afiliacyjne…” |
| Materiał sponsorowany | „Materiał sponsorowany. Materiał powstał na zlecenie i za wynagrodzeniem: {partnerzy}.” (+ `sponsor` w danych strukturalnych) |
| Współpraca reklamowa | „Współpraca reklamowa. Tekst powstał we współpracy reklamowej z: {partnerzy}.” |
| Produkty od producenta (barter) | „Produkty od producenta. Produkty przekazali nieodpłatnie: {partnerzy}.” |

   Dla trzech ostatnich walidacja wymaga co najmniej jednego partnera. Jeśli artykuł zawiera link afiliacyjny, a wybrano silniejszy rodzaj, do oznaczenia dochodzi zdanie o afiliacji (silniejsze oznaczenie wygrywa, afiliacja nie jest gubiona).

## Zasady techniczne (z briefu)

- Tylko **zwykłe linki**: `rel="sponsored noopener"`, `target="_blank"`, widoczna etykieta („link afiliacyjny”, „treść sponsorowana”). Żadnych widgetów, wyszukiwarek cen ani iframe'ów partnerów (ustawiają cookies third-party, wpadają do warstwy 3 z sekcji 14).
- **Szablon nie zna sieci afiliacyjnej.** Redaktor wkleja w `affiliateUrl` gotowy link z identyfikatorem partnera wygenerowany w panelu sieci. Do rozliczania twórców użyj osobnego identyfikatora (sub-ID) w panelu sieci, np. `{twórca}-{slug-artykułu}`; to konwencja redakcyjna, nie funkcja kodu.

## Kiedy składać aplikacje do sieci

Sieci zwykle oceniają aplikację na podstawie działającej strony z treścią i ruchem, a program każdej marki zatwierdza się osobno. Zbierz treści (artykuły, profile, Polityka prywatności i cookies, strona Współpraca), a wymagania każdej sieci sprawdź w jej regulaminie przed aplikacją.

## Lista kontrolna umowy z twórcą

- zakres i terminy, forma dostarczenia treści i zdjęć,
- prawa autorskie i licencja (zakres, czas, terytorium, prawo do edycji i tłumaczenia PL/EN),
- zdjęcia: kto jest autorem i na jakiej licencji (podpis wymagany w serwisie),
- wynagrodzenie, ewentualny udział w przychodach (rozliczany poza serwisem),
- obowiązek oznaczania współpracy z markami i zgoda na publikację informacji o współpracach na profilu,
- wyłączność, konkurencja, usunięcie lub zmiana treści,
- dane osobowe twórcy (podstawa przetwarzania, okres przechowywania; polityka prywatności).

## Miary sukcesu (propozycja)

Liczba opublikowanych tekstów gościnnych, kliknięcia i przychody z afiliacji per twórca i per marka (z paneli sieci), odsetek tekstów z poprawnym oznaczeniem (cel 100%), czas od zgłoszenia przez formularz do odpowiedzi.

## Poza zakresem (na razie)

Przepisy jako osobny format z polami składników i kroków (właściciel odłożył), płatne role Sanity i konta twórców, automatyczny rev-share, katalog sprzętu lub sklep, porównywarki cen, osadzane widgety partnerów.
