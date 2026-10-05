"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { DENIED, type ConsentState } from "@/lib/consent/types";
import type { ConsentLabels } from "./ConsentRuntime";

type ConsentContextValue = {
  /** Czy warstwa zgód jest w ogóle aktywna (`NEXT_PUBLIC_ADS_ENABLED`). */
  enabled: boolean;
  /** Czy znamy już wybór (zapisany lub świeżo podany). */
  decided: boolean;
  granted: ConsentState;
  /** Otwiera baner ponownie (zmiana zdania). */
  openPreferences: () => void;
};

const OFF: ConsentContextValue = { enabled: false, decided: false, granted: DENIED, openPreferences: () => {} };
const ConsentContext = createContext<ConsentContextValue>(OFF);

/** Jedyny interfejs do zgód: komponenty pytają `useConsent()`, nigdy nie wstawiają obcego skryptu same. */
export const useConsent = () => useContext(ConsentContext);

type RuntimeProps = {
  labels: ConsentLabels;
  open: boolean;
  onState: (s: ConsentState, decided: boolean) => void;
  onClose: () => void;
};

// Adapter + baner to osobna paczka, pobierana tylko przy włączonej fladze (przy `false` gałąź
// jest usuwana z buildu, więc wersja 1.0 nie niesie ani bajtu tej warstwy).
const loadRuntime = () => import("./ConsentRuntime");

function ActiveProvider({ labels, children }: { labels: ConsentLabels; children: ReactNode }) {
  const [Runtime, setRuntime] = useState<ComponentType<RuntimeProps> | null>(null);
  const [granted, setGranted] = useState<ConsentState>(DENIED);
  const [decided, setDecided] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void loadRuntime().then((m) => setRuntime(() => m.default));
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({ enabled: true, decided, granted, openPreferences: () => setOpen(true) }),
    [decided, granted],
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {Runtime ? (
        <Runtime
          labels={labels}
          open={open}
          onState={(s, d) => {
            setGranted(s);
            setDecided(d);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </ConsentContext.Provider>
  );
}

/**
 * Layout renderuje go wyłącznie przy `NEXT_PUBLIC_ADS_ENABLED=true`. Przy `false` (wersja 1.0)
 * nie istnieje ani w HTML, ani w paczkach JS: żadnego banera, `dataLayer` ani żądania;
 * `useConsent()` zwraca wtedy stan „wyłączone” (`enabled: false`, wszystko odrzucone).
 */
export const ConsentProvider = ActiveProvider;
