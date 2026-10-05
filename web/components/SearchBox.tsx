import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/dictionary";

/**
 * Pole wyszukiwania w stylu headera. Podłączenie Pagefind: faza 3
 * (do tego czasu pole jest tylko markupem).
 */
export function SearchBox({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <form className="search" role="search">
      <label className="sr" htmlFor="site-search">
        {dict.search.label}
      </label>
      <input id="site-search" type="search" name="q" placeholder={dict.search.placeholder} />
      <button type="submit" aria-label={dict.search.label}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
      </button>
    </form>
  );
}
