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

/**
 * Wyszukiwarka w stylu pola z headera (Pagefind). Wynik po Enter / lupie, język wyników =
 * język strony (Pagefind wykrywa go z `<html lang>`). Wymaga JS; bez JS pole nie szuka.
 */
export function SearchBox({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const id = useId();
  const root = useRef<HTMLFormElement>(null);
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.parentElement?.contains(e.target as Node)) {
        setState("idle");
      }
    };
    document.addEventListener("keydown", close);
    document.addEventListener("click", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("click", close);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return setState("idle");
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

  return (
    <>
      <form className="search" role="search" ref={root} onSubmit={submit}>
        <label className="sr" htmlFor={id}>
          {dict.search.label}
        </label>
        <input
          id={id}
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={dict.search.placeholder}
          autoComplete="off"
        />
        <button type="submit" aria-label={dict.search.label}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
        </button>
      </form>
      {state !== "idle" ? (
        <div className="search-results" role="region" aria-label={dict.search.results} aria-live="polite">
          {state === "busy" ? <p className="search-status">{dict.search.searching}</p> : null}
          {state === "error" ? <p className="search-status">{dict.search.unavailable}</p> : null}
          {state === "done" && results.length === 0 ? <p className="search-status">{dict.search.noResults}</p> : null}
          {state === "done" && results.length > 0 ? (
            <ul>
              {results.map((r) => (
                <li key={r.url}>
                  <Link href={r.url} onClick={() => setState("idle")}>
                    {r.title}
                  </Link>
                  <p dangerouslySetInnerHTML={{ __html: r.excerpt }} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
