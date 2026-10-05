"use client";

import { useEffect, useRef, useState } from "react";
import { ADSENSE } from "@/lib/config";
import { consentModeDefault, consentModeUpdate, mountAdSlots } from "@/lib/consent/gatekeeper";
import { internalAdapter } from "@/lib/consent/internalAdapter";
import { DENIED, type ConsentState } from "@/lib/consent/types";

export type ConsentLabels = {
  aria: string;
  title: string;
  text: string;
  accept: string;
  reject: string;
  policy: string;
  policyHref: string;
  settings: string;
};

const ALL: ConsentState = { analytics: true, advertising: true };

/** Adapter CMP + baner. Ładowany leniwie, tylko przy włączonej fladze (ConsentProvider). */
export default function ConsentRuntime({
  labels,
  open,
  onState,
  onClose,
}: {
  labels: ConsentLabels;
  open: boolean;
  onState: (s: ConsentState, decided: boolean) => void;
  onClose: () => void;
}) {
  const [undecided, setUndecided] = useState(false);
  const [reopened, setReopened] = useState(false);
  const first = useRef<HTMLButtonElement>(null);
  const adapter = internalAdapter;

  useEffect(() => {
    consentModeDefault(); // przed jakimkolwiek tagiem Google
    let live = true;
    void adapter.init().then((saved) => {
      if (!live) return;
      if (saved) {
        apply(saved);
        onState(saved, true);
      } else {
        setUndecided(true);
      }
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function apply(state: ConsentState) {
    consentModeUpdate(state);
    mountAdSlots(state, ADSENSE); // jedyna droga do skryptu AdSense: gatekeeper, po zgodzie
  }

  // „Ustawienia zgód” w stopce (zwykły przycisk z serwera) otwierają baner ponownie
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element).closest("[data-consent-open]")) setReopened(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const visible = undecided || open || reopened;
  useEffect(() => {
    if (visible) first.current?.focus({ preventScroll: true });
  }, [visible]);

  function choose(state: ConsentState) {
    adapter.save(state);
    apply(state);
    onState(state, true);
    setUndecided(false);
    setReopened(false);
    onClose();
  }

  if (!visible) return null;
  return (
    <section className="consent" role="region" aria-label={labels.aria} data-consent-banner>
      <p className="consent-title">{labels.title}</p>
      <p className="consent-text">
        {labels.text} <a href={labels.policyHref}>{labels.policy}</a>
      </p>
      <div className="consent-actions">
        {/* równorzędne przyciski: odmowa tak samo łatwa i widoczna jak zgoda */}
        <button ref={first} type="button" onClick={() => choose(DENIED)}>
          {labels.reject}
        </button>
        <button type="button" onClick={() => choose(ALL)}>
          {labels.accept}
        </button>
      </div>
    </section>
  );
}
