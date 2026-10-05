import { DENIED, type ConsentAdapter, type ConsentState } from "./types";

const KEY = "consent.v1";

/**
 * Adapter wewnętrzny: wybór w `localStorage` (bez cookies). To implementacja referencyjna
 * do budowy i testów; NIE jest certyfikowanym CMP (TCF 2.2), więc nie wystarcza do serwowania
 * reklam AdSense w EOG. Przed włączeniem reklam zastąp ją adapterem certyfikowanego CMP (CP5).
 */
export const internalAdapter: ConsentAdapter = {
  async init() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const v = JSON.parse(raw) as Partial<ConsentState>;
      return { analytics: v.analytics === true, advertising: v.advertising === true };
    } catch {
      return null;
    }
  },
  save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...DENIED, ...state }));
    } catch {
      /* tryb prywatny: wybór obowiązuje do końca wizyty */
    }
  },
};
