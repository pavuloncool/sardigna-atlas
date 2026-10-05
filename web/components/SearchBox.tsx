"use client";

import { useRef, useState, type ComponentType } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { Glass } from "./Glass";

type OverlayProps = {
  locale: Locale;
  getOrigin: () => DOMRect;
  onClosed: () => void;
  onDismiss: () => void;
};

// Nakładka (Pagefind, animacje) to osobna paczka: pobierana przy pierwszym najechaniu/fokusie/kliknięciu.
// Zwykły `import()` zamiast `next/dynamic`, żeby nie dokładać runtime'u Loadable do każdej strony.
const loadOverlay = () => import("./SearchOverlay");

/**
 * Napisy przychodzą z serwera (`labels`), żeby słowniki nie trafiały do paczki klienta.
 * Pole wyszukiwania w headerze: cienka linia u dołu i lupa po prawej. Kliknięcie rozwija
 * pełnoekranową wyszukiwarkę (components/SearchOverlay.tsx).
 */
export function SearchBox({ locale, labels }: { locale: Locale; labels: { placeholder: string; open: string } }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [Overlay, setOverlay] = useState<ComponentType<OverlayProps> | null>(null);

  function show() {
    setOpen(true);
    void loadOverlay().then((m) => setOverlay(() => m.default));
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="search search-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={labels.open}
        onPointerEnter={() => void loadOverlay()}
        onFocus={() => void loadOverlay()}
        onClick={show}
      >
        <span className="search-label">{labels.placeholder}</span>
        <Glass />
      </button>
      {open && Overlay ? (
        <Overlay
          locale={locale}
          getOrigin={() => trigger.current!.getBoundingClientRect()}
          onClosed={() => {
            setOpen(false);
            trigger.current?.focus({ preventScroll: true });
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
