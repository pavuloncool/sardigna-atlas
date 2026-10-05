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
