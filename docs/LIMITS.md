# Limity i ceny

> Zweryfikowane **2026-10-05** w oficjalnej dokumentacji i cennikach (linki w tabeli). Limity zmieniają się: przed decyzjami kosztowymi sprawdzić ponownie.

| Usługa | Limit (plan darmowy) | Źródło |
|---|---|---|
| Cloudflare Pages | 500 buildów/mies., 1 build naraz, timeout buildu 20 min, do 20 000 plików na wdrożenie, plik do 25 MiB, 100 domen własnych na projekt, 100 projektów na konto, nielimitowane podglądy (preview). Żądania do zasobów statycznych bez limitu. | developers.cloudflare.com/pages/platform/limits |
| Cloudflare Pages Functions | liczą się do limitów Workers (w briefie: 100 000 żądań/dzień, 10 ms CPU, 50 subrequestów; dokumentacja Pages nie podaje dziennego limitu wprost, wartość z briefu nie została niezależnie potwierdzona) | developers.cloudflare.com/pages/functions/pricing |
| Sanity Free | do 20 miejsc użytkowników, **tylko role Administrator i Viewer** (Contributor/Editor w planach płatnych), 10 000 dokumentów, 2 datasety (publiczne), 1 mln żądań API CDN/mies., 250 000 żądań API/mies., 100 GB transferu/mies., 100 GB zasobów | sanity.io/pricing |
| Resend Free | 3 000 maili/mies., 100 maili/dzień, 3 domeny (wykorzystana 1: `mail.mysardinia.online`), retencja danych 30 dni | resend.com/pricing |
| Cloudflare Web Analytics | bez limitu w planie darmowym (włączane w panelu projektu Pages); szczegóły i pliki cookies do potwierdzenia po włączeniu (zob. `DEPLOY.md`) | developers.cloudflare.com/web-analytics |

## Konsekwencje dla działania serwisu

- **Budżet buildów:** każda publikacja w Studio uruchamia webhook → jeden build (≈ 1–2 min). 500 buildów/mies. to ok. 16 dziennie; hurtowa publikacja N dokumentów daje N buildów (Pages kolejkuje je po jednym). Publikuj zmiany seriami rozsądnie i unikaj pętli (`DEPLOY.md`).
- **Formularz kontaktowy:** Resend Free przyjmie 100 maili dziennie; po przekroczeniu funkcja zwraca czytelny komunikat „limit” (nie błąd 500).
- **Liczba plików:** ok. 500 plików na wdrożenie przy limicie 20 000; obrazy z `cdn.sanity.io` nie powiększają `out/`.
- **Sanity API:** build czyta dane tylko w czasie budowania, a ruch czytelników nie zużywa limitów API (statyczne strony).

## Plan awaryjny dla obrazów
Gdy bandwidth Sanity zbliży się do limitu: własna subdomena `img.` przed `cdn.sanity.io` z cache na Cloudflare.
