"use client";

import Link from "@/components/Link";
import { useEffect, useId, useRef, useState } from "react";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { Glass } from "./Glass";

type Result = { url: string; title: string; excerpt: string };
type Pagefind = {
  options: (o: Record<string, unknown>) => Promise<void>;
  search: (q: string) => Promise<{
    results: { data: () => Promise<{ url: string; excerpt: string; meta: { title?: string } }> }[];
  }>;
};

let pagefind: Promise<Pagefind> | null = null;
// Indeks Pagefind powstaje po buildzie (postbuild); w `next dev` go nie ma → komunikat zamiast błędu.
const loadPagefind = () =>
  (pagefind ??= import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "/pagefind/pagefind.js" as string)
    .then(async (m: Pagefind) => {
      await m.options({ excerptLength: 18 });
      return m;
    })
    .catch((e) => {
      pagefind = null;
      throw e;
    }));

const DURATION = 480;
const EASE = "cubic-bezier(0.22, 0.7, 0.2, 1)";

/**
 * Wyszukiwarka na cały ekran (Pagefind). Ładowana dopiero po kliknięciu pola w headerze
 * (osobna paczka JS, budżet z fazy 5). Animacja: `clip-path` od prostokąta pola (`getOrigin`)
 * do całego okna; zamykanie to animacja w drugą stronę. `onClosed` oddaje fokus do pola,
 * `onDismiss` zamyka bez ruchu fokusa (np. po przejściu do wyniku).
 */
export default function SearchOverlay({
  locale,
  getOrigin,
  onClosed,
  onDismiss,
}: {
  locale: Locale;
  getOrigin: () => DOMRect;
  onClosed: () => void;
  onDismiss: () => void;
}) {
  const dict = getDictionary(locale);
  const titleId = useId();
  const layer = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [results, setResults] = useState<Result[]>([]);

  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clipFromOrigin = () => {
    const r = getOrigin();
    const { clientWidth: w, clientHeight: h } = document.documentElement;
    return `inset(${r.top}px ${Math.max(0, w - r.right)}px ${Math.max(0, h - r.bottom)}px ${r.left}px)`;
  };

  // Animacja otwarcia + rozgrzewka indeksu Pagefind.
  useEffect(() => {
    const el = layer.current!;
    document.documentElement.style.overflow = "hidden";
    void loadPagefind().catch(() => undefined); // błąd pokażemy dopiero przy szukaniu
    if (!reduced()) {
      el.animate([{ clipPath: clipFromOrigin() }, { clipPath: "inset(0px 0px 0px 0px)" }], { duration: DURATION, easing: EASE });
      el.querySelector(".so-inner")?.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], {
        duration: DURATION - 120,
        delay: 140,
        easing: EASE,
        fill: "backwards",
      });
    }
    input.current?.focus({ preventScroll: true });
    return () => {
      document.documentElement.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animacja tylko przy montowaniu
  }, []);

  function close() {
    const el = layer.current;
    if (!el || reduced()) return onClosed();
    el.animate([{ clipPath: "inset(0px 0px 0px 0px)" }, { clipPath: clipFromOrigin() }], {
      duration: DURATION - 80,
      easing: EASE,
      fill: "forwards",
    }).onfinish = onClosed;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return input.current?.focus();
    setState("busy");
    try {
      const pf = await loadPagefind();
      const found = await pf.search(term);
      const data = await Promise.all(found.results.slice(0, 8).map((r) => r.data()));
      setResults(data.map((d) => ({ url: d.url, title: d.meta.title ?? d.url, excerpt: d.excerpt })));
      setState("done");
    } catch {
      setState("error");
    }
  }

  // Esc zamyka, Tab krąży wewnątrz okna (focus trap).
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      return close();
    }
    if (e.key !== "Tab" || !layer.current) return;
    const items = [...layer.current.querySelectorAll<HTMLElement>("input, button, a[href]")].filter((n) => !n.hasAttribute("disabled"));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div ref={layer} className="search-overlay" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKeyDown}>
      <h2 id={titleId} className="sr">
        {dict.search.dialog}
      </h2>
      <button type="button" className="so-close" aria-label={dict.search.close} onClick={close}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>
      <div className="so-inner">
        <form className="so-form" role="search" onSubmit={submit}>
          <label className="sr" htmlFor={`${titleId}-q`}>
            {dict.search.label}
          </label>
          <input
            id={`${titleId}-q`}
            ref={input}
            type="search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={dict.search.placeholder}
            autoComplete="off"
            enterKeyHint="search"
          />
          <button type="submit" className="so-go" aria-label={dict.search.go}>
            <Glass size={34} />
          </button>
        </form>
        <div className="so-results" aria-live="polite">
          {state === "busy" ? <p className="search-status">{dict.search.searching}</p> : null}
          {state === "error" ? <p className="search-status">{dict.search.unavailable}</p> : null}
          {state === "done" && results.length === 0 ? <p className="search-status">{dict.search.noResults}</p> : null}
          {state === "done" && results.length > 0 ? (
            <ul>
              {results.map((r) => (
                <li key={r.url}>
                  <Link href={r.url} onClick={onDismiss}>
                    {r.title}
                  </Link>
                  <p dangerouslySetInnerHTML={{ __html: r.excerpt }} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
