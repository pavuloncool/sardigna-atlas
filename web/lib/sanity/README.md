# web/lib/sanity

`queries.ts` wymaga tylko pakietu `groq` (`pnpm add groq`). Klient: `next-sanity` lub `@sanity/client`
z `perspective: 'published'`, `useCdn: false` w buildzie (build i tak ma niski ruch, a CDN nie jest potrzebny)
oraz `apiVersion` z `studio/lib/languages.ts`.

Zapytania zostały sprawdzone parserem `groq-js` oraz wykonane na zbiorze testowym w pamięci
(hierarchia miejsc, tłumaczenia, entityLink, fallback językowy, artykuły podobne).
