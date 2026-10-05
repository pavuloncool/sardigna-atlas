import type { ConsentCategory, ConsentState } from "./types";

/**
 * Gatekeeper: JEDYNE miejsce w kodzie, które dokłada obcy `<script>` (sekcja 14 briefu).
 * Skrypt dla kategorii bez zgody nie zostanie wstawiony, nawet gdy wywoła go zły komponent.
 */

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

const loaded = new Set<string>();

/** Google Consent Mode v2: kolejka poleceń (`dataLayer`), bez żadnego żądania sieciowego. */
function gtag(): GtagWindow["gtag"] {
  const w = window as GtagWindow;
  w.dataLayer = w.dataLayer || [];
  w.gtag =
    w.gtag ||
    function () {
      // Google wymaga obiektu `arguments`, nie tablicy.
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
  return w.gtag;
}

const mode = (granted: boolean) => (granted ? "granted" : "denied");

/** Domyślny stan `denied` dla wszystkich sygnałów; musi być ustawiony przed jakimkolwiek tagiem Google. */
export function consentModeDefault() {
  gtag()!("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
}

/** Przekazuje wybór użytkownika do Consent Mode. */
export function consentModeUpdate(state: ConsentState) {
  gtag()!("consent", "update", {
    ad_storage: mode(state.advertising),
    ad_user_data: mode(state.advertising),
    ad_personalization: mode(state.advertising),
    analytics_storage: mode(state.analytics),
  });
}

/** Wstawia skrypt third-party wyłącznie przy zgodzie na daną kategorię; powtórne wywołanie nic nie robi. */
export function loadScript(
  category: ConsentCategory,
  state: ConsentState,
  src: string,
  attrs: Record<string, string> = {},
): boolean {
  if (!state[category]) return false;
  if (loaded.has(src)) return true;
  const el = document.createElement("script");
  el.src = src;
  el.async = true;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.head.appendChild(el);
  loaded.add(src);
  return true;
}

/** AdSense: skrypt i `data-ad-client` tylko stąd (kategoria `advertising`). */
export function loadAdsense(state: ConsentState, client: string): boolean {
  return loadScript(
    "advertising",
    state,
    `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`,
    { crossorigin: "anonymous" },
  );
}

type AdsWindow = Window & { adsbygoogle?: unknown[] };

/**
 * Wstawia jednostki In-Feed do pustych slotów `.ad-slot` (renderowanych przez serwer, więc React
 * nie zarządza ich zawartością). Wywoływane po zgodzie na `advertising`; bez zgody nic nie robi.
 */
export function mountAdSlots(
  state: ConsentState,
  ad: { client: string; slot: string; layoutKey: string },
): void {
  if (!state.advertising || !ad.client) return;
  if (!loadAdsense(state, ad.client)) return;
  for (const slot of document.querySelectorAll<HTMLElement>(".ad-slot:not([data-mounted])")) {
    slot.dataset.mounted = "";
    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.dataset.adClient = ad.client;
    ins.dataset.adSlot = ad.slot;
    ins.dataset.adFormat = "fluid";
    ins.dataset.adLayoutKey = ad.layoutKey;
    slot.appendChild(ins);
    try {
      const w = window as AdsWindow;
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      /* reklama niedostępna: slot zostaje pusty */
    }
  }
}
