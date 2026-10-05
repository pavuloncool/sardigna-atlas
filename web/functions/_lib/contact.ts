/**
 * Logika formularza kontaktowego (Pages Function): walidacja, honeypot, Turnstile, Resend.
 * Wydzielona z `functions/api/contact.ts`, żeby dało się ją testować bez środowiska Cloudflare
 * (`fetch` jest wstrzykiwany). Wszystkie odpowiedzi to JSON `{ ok: true }` albo
 * `{ ok: false, error: <kod> }`; teksty dla użytkownika dobiera front (słowniki PL/EN).
 */
export interface Env {
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  TURNSTILE_SECRET_KEY?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

export type ErrorCode =
  | "method" //      zły typ żądania
  | "origin" //      żądanie spoza naszej domeny
  | "too_large" //   zbyt duże ciało żądania
  | "invalid" //     błędne dane (pola w `fields`)
  | "captcha" //     Turnstile odrzucił token
  | "limit" //       limit wysyłki (Resend: 100 maili/dzień lub rate limit)
  | "unavailable"; // brak konfiguracji albo awaria usługi zewnętrznej

export type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

const MAX_BODY = 20_000;
const TIMEOUT_MS = 8_000;
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

const fail = (status: number, error: ErrorCode, extra: Record<string, unknown> = {}) =>
  json(status, { ok: false, error, ...extra });

/** Usuwa znaki nowej linii (wstrzykiwanie nagłówków) i przycina długość. */
const oneLine = (s: string, max: number) => s.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

export function allowedOrigin(origin: string | null, env: Env): boolean {
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  const site = env.NEXT_PUBLIC_SITE_URL ? new URL(env.NEXT_PUBLIC_SITE_URL).host : null;
  return (
    host === site ||
    host === (site ? "www." + site : "") ||
    host === "localhost" ||
    host.startsWith("localhost:") ||
    host.endsWith(".pages.dev")
  );
}

async function readFields(request: Request): Promise<Record<string, string> | null> {
  const type = request.headers.get("Content-Type") ?? "";
  try {
    if (type.includes("application/json")) {
      const data = (await request.json()) as Record<string, unknown>;
      return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === "string" ? v : ""]));
    }
    const form = await request.formData();
    return Object.fromEntries([...form.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  } catch {
    return null;
  }
}

/** Tematy formularza (wartości wysyłane przez front); etykiety w mailu są po polsku, bo czyta je redakcja. */
export const TOPICS = {
  question: "Pytanie lub uwaga",
  creator: "Propozycja współpracy (twórca)",
  brand: "Partnerstwo (marka)",
  correction: "Poprawka w tekście",
  other: "Inne",
} as const;
export type Topic = keyof typeof TOPICS;

export interface ContactInput {
  topic: Topic;
  name: string;
  email: string;
  message: string;
  token: string;
  locale: string;
}

/** Zwraca dane albo listę nazw błędnych pól. */
export function validate(fields: Record<string, string>): { ok: true; value: ContactInput } | { ok: false; fields: string[] } {
  const name = oneLine(fields.name ?? "", 100);
  const email = (fields.email ?? "").trim();
  const message = (fields.message ?? "").replace(/\r\n/g, "\n").trim();
  const bad: string[] = [];
  // Brak tematu = „pytanie” (zgodność ze starszym frontem); nieznana wartość = błąd.
  const rawTopic = (fields.topic ?? "question").trim() || "question";
  const topic = rawTopic in TOPICS ? (rawTopic as Topic) : null;
  if (!topic) bad.push("topic");
  if (name.length < 1) bad.push("name");
  if (email.length > 254 || !EMAIL_RE.test(email)) bad.push("email");
  if (message.length < 10 || message.length > 5000) bad.push("message");
  if (bad.length) return { ok: false, fields: bad };
  const locale = /^[a-z]{2}$/.test(fields.locale ?? "") ? fields.locale : "pl";
  return { ok: true, value: { topic: topic!, name, email, message, token: fields["cf-turnstile-response"] ?? "", locale } };
}

async function verifyTurnstile(token: string, ip: string | null, env: Env, doFetch: Fetch) {
  if (!token || token.length > 2048) return "captcha" as const;
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY!, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const res = await doFetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return "unavailable" as const;
    const data = (await res.json()) as { success?: boolean };
    return data.success ? ("ok" as const) : ("captcha" as const);
  } catch {
    return "unavailable" as const;
  }
}

async function sendMail(input: ContactInput, env: Env, doFetch: Fetch) {
  const text = [
    `Temat / topic: ${TOPICS[input.topic]}`,
    `Imię / name: ${input.name}`,
    `E-mail: ${input.email}`,
    `Język strony / site language: ${input.locale}`,
    "",
    input.message,
  ].join("\n");
  try {
    const res = await doFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `Sardigna Atlas <${env.CONTACT_FROM_EMAIL}>`,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: input.email,
        subject: `[Sardigna Atlas] ${TOPICS[input.topic]}: ${oneLine(input.name, 60)}`,
        text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) return "ok" as const;
    // Limit wysyłki (Resend Free: 100/dzień, 3000/miesiąc) i rate limit → czytelny komunikat, nie 500.
    const err = (await res.json().catch(() => ({}))) as { name?: string };
    if (res.status === 429 || /quota|rate_limit/i.test(err.name ?? "")) return "limit" as const;
    return "unavailable" as const;
  } catch {
    return "unavailable" as const;
  }
}

export async function handleContact(request: Request, env: Env, doFetch: Fetch = fetch): Promise<Response> {
  if (request.method !== "POST") return fail(405, "method");
  if (!allowedOrigin(request.headers.get("Origin"), env)) return fail(403, "origin");
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY) return fail(413, "too_large");

  const fields = await readFields(request);
  if (!fields) return fail(400, "invalid", { fields: [] });

  // Honeypot: pole ukryte przed ludźmi. Bot dostaje "sukces", a nic nie wysyłamy.
  if ((fields.website ?? "").trim() !== "") return json(200, { ok: true });

  const parsed = validate(fields);
  if (!parsed.ok) return fail(422, "invalid", { fields: parsed.fields });

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL || !env.TURNSTILE_SECRET_KEY) {
    return fail(503, "unavailable");
  }

  const captcha = await verifyTurnstile(parsed.value.token, request.headers.get("CF-Connecting-IP"), env, doFetch);
  if (captcha === "captcha") return fail(400, "captcha");
  if (captcha === "unavailable") return fail(503, "unavailable");

  const sent = await sendMail(parsed.value, env, doFetch);
  if (sent === "limit") return fail(429, "limit");
  if (sent === "unavailable") return fail(503, "unavailable");
  return json(200, { ok: true });
}
