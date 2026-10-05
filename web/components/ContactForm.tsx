"use client";

import Link from "@/components/Link";
import { useEffect, useId, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locales";

type Props = { locale: Locale; dict: Dictionary["contact"]; privacyHref: string; siteKey: string };
type Status = "idle" | "sending" | "success" | "error";
type TurnstileApi = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string;
  reset: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Formularz kontaktowy → POST /api/contact (Pages Function). Turnstile ładuje się dopiero przy
 * pierwszej interakcji z formularzem (zasada z sekcji 14: żadnych skryptów third-party bez potrzeby),
 * honeypot `website` jest ukryty przed ludźmi.
 */
export function ContactForm({ locale, dict, privacyHref, siteKey }: Props) {
  const uid = useId();
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef("");
  const loading = useRef(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<keyof Dictionary["contact"]["errors"] | null>(null);
  const [bad, setBad] = useState<string[]>([]);

  function mount() {
    if (widgetId.current || !widget.current || !window.turnstile) return;
    widgetId.current = window.turnstile.render(widget.current, {
      sitekey: siteKey,
      theme: "auto",
      callback: (t: string) => (token.current = t),
      "expired-callback": () => (token.current = ""),
      "error-callback": () => (token.current = ""),
    });
  }

  function load() {
    if (!siteKey || loading.current) return;
    loading.current = true;
    if (window.turnstile) return mount();
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = mount;
    document.head.appendChild(s);
  }

  useEffect(() => () => void (widgetId.current = null), []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    if (!token.current) {
      setError("captchaWait");
      setStatus("error");
      load();
      return;
    }
    setStatus("sending");
    setError(null);
    setBad([]);
    const data = new FormData(e.currentTarget);
    data.set("cf-turnstile-response", token.current);
    data.set("locale", locale);
    try {
      const res = await fetch("/api/contact", { method: "POST", body: data });
      const out = (await res.json()) as { ok: boolean; error?: string; fields?: string[] };
      if (out.ok) {
        setStatus("success");
        (e.currentTarget as HTMLFormElement | null)?.reset();
        return;
      }
      setBad(out.fields ?? []);
      setError(out.error === "invalid" || out.error === "captcha" || out.error === "limit" ? out.error : "unavailable");
    } catch {
      setError("network");
    }
    // token Turnstile jest jednorazowy: po każdej próbie prosimy o nowy
    token.current = "";
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
    setStatus("error");
  }

  const [before, after] = dict.notice.split("{privacy}");
  const field = (name: string, label: string, el: React.ReactNode) => (
    <div className={`field${bad.includes(name) ? " field-bad" : ""}`}>
      <label htmlFor={`${uid}-${name}`}>{label}</label>
      {el}
    </div>
  );

  if (status === "success") {
    return (
      <p className="form-status" role="status">
        {dict.success}
      </p>
    );
  }

  return (
    <form className="contact-form" aria-label={dict.aria} onSubmit={submit} onFocusCapture={load} noValidate>
      {field("name", dict.name, <input id={`${uid}-name`} name="name" type="text" autoComplete="name" required maxLength={100} aria-invalid={bad.includes("name")} />)}
      {field("email", dict.email, <input id={`${uid}-email`} name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={bad.includes("email")} />)}
      {field("message", dict.message, <textarea id={`${uid}-message`} name="message" rows={6} required minLength={10} maxLength={5000} aria-invalid={bad.includes("message")} />)}
      {/* honeypot: ukryty dla ludzi i czytników ekranu */}
      <div className="hp" aria-hidden="true">
        <label htmlFor={`${uid}-website`}>Website</label>
        <input id={`${uid}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div ref={widget} className="turnstile" />
      <p className="form-note">
        {before}
        <Link href={privacyHref}>{dict.privacyLink}</Link>
        {after}
      </p>
      <button type="submit" className="form-submit" disabled={status === "sending"}>
        {status === "sending" ? dict.sending : dict.submit}
      </button>
      {status === "error" && error ? (
        <p className="form-status form-error" role="alert">
          {dict.errors[error]}
        </p>
      ) : null}
    </form>
  );
}
