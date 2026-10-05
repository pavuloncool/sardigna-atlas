"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locales";

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

const Glass = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m16 16 5 5" />
  </svg>
);

/**
 * Wyszukiwarka (Pagefind). W headerze: pole z cienką linią u dołu i lupą po prawej. Kliknięcie
 * rozwija je na cały ekran (animacja od położenia pola): duże pole wpisywania, lupa po prawej
 * uruchamia wyszukiwanie (tak samo Enter), wyniki pojawiają się pod polem. Esc / × zamyka
 * (animacja w drugą stronę) i oddaje fokus do pola w headerze. Język wyników = język strony.
 */
export function SearchBox({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const titleId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [results, setResults] = useState<Result[]>([]);

  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clipFromTrigger = () => {
    const r = trigger.current!.getBoundingClientRect();
    const { clientWidth: w, clientHeight: h } = document.documentElement;
    return `inset(${r.top}px ${Math.max(0, w - r.right)}px ${Math.max(0, h - r.bottom)}px ${r.left}px)`;
  };

  function openSearch() {
    setOpen(true);
    void loadPagefind().catch(() => undefined); // rozgrzewka indeksu, błąd pokażemy dopiero przy szukaniu
  }

  // Animacja otwarcia: warstwa rozwija się z prostokąta pola w headerze na cały ekran.
  useEffect(() => {
    if (!open || !layer.current) return;
    const el = layer.current;
    document.documentElement.style.overflow = "hidden";
    if (!reduced()) {
      el.animate([{ clipPath: clipFromTrigger() }, { clipPath: "inset(0px 0px 0px 0px)" }], {
        duration: DURATION,
        easing: EASE,
      });
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
  }, [open]);

  function close() {
    const el = layer.current;
    const done = () => {
      setOpen(false);
      setState("idle");
      trigger.current?.focus({ preventScroll: true });
    };
    if (!el || reduced()) return done();
    el.animate([{ clipPath: "inset(0px 0px 0px 0px)" }, { clipPath: clipFromTrigger() }], {
      duration: DURATION - 80,
      easing: EASE,
      fill: "forwards",
    }).onfinish = done;
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
    <>
      <button
        ref={trigger}
        type="button"
        className="search search-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={dict.search.open}
        onClick={openSearch}
      >
        <span className="search-label">{dict.search.placeholder}</span>
        <Glass />
      </button>

      {open ? (
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
                      <Link href={r.url} onClick={() => setOpen(false)}>
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
      ) : null}
    </>
  );
}
