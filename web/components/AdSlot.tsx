import { ADS_ENABLED } from "@/lib/config";

/**
 * Miejsce na reklamę In-Feed (sekcja 13). W wersji 1.0 slot jest pusty, ukryty i nie ładuje
 * żadnego skryptu; skrypt AdSense dołoży WYŁĄCZNIE gatekeeper zgód (faza 7).
 * Zarezerwowana wysokość (`aspect-ratio` + `min-height`) chroni CLS po włączeniu reklam.
 */
export function AdSlot({ variant }: { variant: "in-feed" }) {
  return <div className="ad-slot" data-variant={variant} aria-hidden="true" hidden={!ADS_ENABLED} />;
}
