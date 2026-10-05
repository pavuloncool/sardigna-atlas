# Limity i ceny

> Szkielet. Wartości z briefu (sekcja 3) pochodzą z września 2026 i **nie zostały jeszcze zweryfikowane**. Uzupełnić w fazie 6 wraz z datą weryfikacji i linkami do źródeł.

| Usługa | Limit z briefu | Zweryfikowano | Źródło |
|---|---|---|---|
| Cloudflare Pages | statyka bez limitu; Functions: 100 000 żądań/dzień, 10 ms CPU; 500 buildów/mies. | — | — |
| Sanity Free | do sprawdzenia (`sanity.io/pricing`) | **2026-10-05**: do 20 miejsc użytkowników, **tylko role Administrator i Viewer** (Contributor/Editor tylko w planach płatnych), 10 000 dokumentów, 2 datasety (publiczne), 1 mln żądań API CDN/mies., 250 000 żądań API/mies., 100 GB transferu/mies., 100 GB zasobów | https://www.sanity.io/pricing |
| Resend Free | 3 000 maili/mies., 100/dzień | — | — |

## Plan awaryjny dla obrazów
Gdy bandwidth Sanity zbliży się do limitu: własna subdomena `img.` przed `cdn.sanity.io` z cache na Cloudflare.
