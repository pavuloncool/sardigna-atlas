/** Kategorie zgód (sekcja 14 briefu). `necessary` nie wymaga zgody i nie jest tu przechowywana. */
export type ConsentCategory = "analytics" | "advertising";
export type ConsentState = Record<ConsentCategory, boolean>;

export const DENIED: ConsentState = { analytics: false, advertising: false };

/**
 * Adapter CMP: jedyne miejsce, które wie, gdzie żyje stan zgód. Podmiana implementacji na
 * certyfikowany CMP (Google-certified, TCF 2.2) nie dotyka reszty kodu (CP5, docs/PRIVACY.md).
 */
export interface ConsentAdapter {
  /** Zwraca zapisany wybór albo `null`, gdy użytkownik jeszcze nie zdecydował. */
  init(): Promise<ConsentState | null>;
  /** Zapisuje wybór użytkownika. */
  save(state: ConsentState): void;
}
