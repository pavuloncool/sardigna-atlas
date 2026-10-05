"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export type HeroColumn = {
  word: string;
  text: string;
  links: { label: string; href: string }[];
};

/**
 * Hero z docs/prototype/sardigna-home-prototype.html: jedna animacja sterowana scrollem.
 * Wordmark (#brand w headerze) jedzie ze środka ekranu do headera, a trzy słowa hasła
 * rozsuwają się na trzy kolumny (FLIP, pomiar z elementu-widma `.ghost`).
 * Logika `measure()` / `frame()` jest przeniesiona z prototypu bez zmian.
 * Bez JS, przy prefers-reduced-motion i poniżej 900 px zostaje statyczny fallback.
 */
export function Hero({ columns }: { columns: HeroColumn[] }) {
  const hero = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heroEl = hero.current!;
    const stageEl = stage.current!;
    const brand = document.getElementById("brand");
    if (!brand) return;

    const d = document.documentElement;
    const mq = matchMedia("(min-width:900px) and (prefers-reduced-motion:no-preference)");
    const words = [...stageEl.querySelectorAll<HTMLElement>(".cols .w")];
    const ghosts = [...stageEl.querySelectorAll<HTMLElement>(".ghost .w")];
    const fades = [...stageEl.querySelectorAll<HTMLElement>(".cols .txt, .cols .links")];
    const pts = [...stageEl.querySelectorAll<HTMLElement>(".cols .pt")];
    let G: { S: number; dy: number; max: number; d: [number, number][] } | null = null;
    let tick = false;

    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const clamp = (v: number) => Math.min(1, Math.max(0, v));

    function reset() {
      stageEl.style.height = "";
      stageEl.style.top = "";
      heroEl.style.height = "";
      brand!.style.transform = "";
      words.forEach((w) => (w.style.transform = ""));
      fades.forEach((x) => {
        x.style.opacity = "";
        x.style.transform = "";
      });
      pts.forEach((x) => {
        x.style.maxWidth = "";
        x.style.opacity = "";
      });
    }

    function measure() {
      reset();
      G = null;
      d.classList.toggle("anim", mq.matches);
      if (!mq.matches) return;
      const vh = innerHeight;
      const cols = stageEl.querySelector<HTMLElement>(".cols")!;
      const need = Math.max(vh, cols.offsetTop + cols.offsetHeight + vh * 0.06);
      stageEl.style.height = need + "px";
      stageEl.style.top = Math.min(0, vh - need) + "px";
      heroEl.style.height = need + vh + "px";
      const b = brand!.getBoundingClientRect();
      const S = Math.min(innerWidth * 0.48, 640) / b.width;
      G = {
        S,
        dy: vh * 0.44 - (b.top + b.height / 2),
        max: vh,
        d: words.map((w, i) => {
          const a = w.getBoundingClientRect();
          const g = ghosts[i].getBoundingClientRect();
          return [g.left - a.left, g.top - a.top] as [number, number];
        }),
      };
      frame();
    }

    function frame() {
      tick = false;
      if (!G) return;
      const p = clamp(scrollY / G.max);
      const r = 1 - ease(clamp(p / 0.55));
      const f = clamp((p - 0.5) / 0.25);
      brand!.style.transform = `translate3d(0,${G.dy * r}px,0) scale(${1 + (G.S - 1) * r})`;
      words.forEach((w, i) => {
        w.style.transform = `translate3d(${G!.d[i][0] * r}px,${G!.d[i][1] * r}px,0)`;
      });
      pts.forEach((x) => {
        x.style.maxWidth = 0.5 * r + "em";
        x.style.opacity = String(r);
      });
      fades.forEach((x) => {
        x.style.opacity = String(f);
        x.style.transform = `translateY(${(1 - f) * 14}px)`;
      });
    }

    const req = () => {
      if (!tick) {
        tick = true;
        requestAnimationFrame(frame);
      }
    };
    const toTop = (e: Event) => {
      e.preventDefault();
      scrollTo({ top: 0, behavior: "smooth" });
    };

    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", measure);
    mq.addEventListener("change", measure);
    brand.addEventListener("click", toTop);
    (document.fonts?.ready ?? Promise.resolve()).then(measure);
    measure();

    return () => {
      removeEventListener("scroll", req);
      removeEventListener("resize", measure);
      mq.removeEventListener("change", measure);
      brand.removeEventListener("click", toTop);
      reset();
      d.classList.remove("anim");
    };
  }, []);

  return (
    <div className="hero" id="hero" ref={hero}>
      <div className="stage" id="stage" ref={stage}>
        <div className="ghost" aria-hidden="true">
          {columns.map((c) => (
            <span className="w" key={c.word}>
              {c.word}
              <b className="pt">.</b>
            </span>
          ))}
        </div>
        <div className="cols">
          {columns.map((c) => (
            <section className="col" aria-label={c.word} key={c.word}>
              <h2 className="w" style={{ margin: 0 }}>
                {c.word}
                <b className="pt" aria-hidden="true">
                  .
                </b>
              </h2>
              <p className="txt">{c.text}</p>
              <ul className="links">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
