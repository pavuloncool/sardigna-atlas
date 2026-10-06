"use client";

import { useRef, useState, type ReactNode } from "react";

type Tip = { text: string; x: number; y: number; flip: boolean };

/**
 * Warstwa interakcji mapy Atlasu. SVG i legenda są renderowane na serwerze (children), więc
 * geometria nie trafia do paczki JS (budżet z fazy 5). Zdarzenia obsługiwane przez delegację:
 * `[data-unit]` = region lub „inna kraina” (z `data-tip`), `[data-legend]` = pozycja legendy.
 * Podświetlenie to klasa `is-active` na wszystkich elementach z tym samym `data-id`.
 */
export function MapInteraction({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const activate = (id: string | null) => {
    box.current?.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
    if (id) box.current?.querySelectorAll(`[data-id="${id}"]`).forEach((el) => el.classList.add("is-active"));
  };
  const show = (x: number, y: number, text: string, id: string) => {
    const b = box.current!.getBoundingClientRect();
    const px = x - b.left;
    setTip({ text, x: px, y: y - b.top, flip: px > b.width * 0.55 });
    activate(id);
  };
  const hide = () => {
    setTip(null);
    activate(null);
  };
  const unitOf = (t: EventTarget) => (t as Element).closest?.<HTMLElement>("[data-unit]") ?? null;
  const showAtElement = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    show(r.left + r.width / 2, r.top + r.height / 2, el.dataset.tip!, el.dataset.id!);
  };

  return (
    <div
      className="atlas-map"
      ref={box}
      onKeyDown={(e) => e.key === "Escape" && hide()}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const u = unitOf(e.target);
        if (u) return show(e.clientX + 14, e.clientY + 14, u.dataset.tip!, u.dataset.id!);
        const l = (e.target as Element).closest?.<HTMLElement>("[data-legend]");
        if (l) {
          setTip(null);
          return activate(l.dataset.id!);
        }
        hide();
      }}
      onPointerLeave={hide}
      onFocus={(e) => {
        const u = unitOf(e.target);
        if (u) return showAtElement(u);
        const l = (e.target as Element).closest?.<HTMLElement>("[data-legend]");
        if (l) activate(l.dataset.id!);
      }}
      onBlur={hide}
      onClick={(e) => {
        const u = unitOf(e.target);
        if (u && !u.matches("a")) showAtElement(u); // dotyk na regionie bez linku
      }}
    >
      {children}
      {tip ? (
        <div className={`map-tip${tip.flip ? " flip" : ""}`} style={{ left: tip.x, top: tip.y }} role="status">
          {tip.text}
        </div>
      ) : null}
    </div>
  );
}
