import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

export type PageName = "about" | "collaborate" | "contact" | "privacy-policy" | "cookie-policy";

/**
 * Treść stron statycznych z `web/content/{nazwa}.{język}.md`, renderowana w buildzie.
 * Brak pliku dla języka (np. `de`) → język domyślny. Tytuł = pierwszy nagłówek `# `.
 */
export function loadPage(name: PageName, locale: Locale) {
  const dir = path.join(process.cwd(), "content");
  const file = [locale, DEFAULT_LOCALE]
    .map((l) => path.join(dir, `${name}.${l}.md`))
    .find((f) => existsSync(f));
  if (!file) throw new Error(`Brak treści content/${name}.${DEFAULT_LOCALE}.md`);

  const raw = readFileSync(file, "utf8");
  const title = /^#\s+(.+)$/m.exec(raw)?.[1]?.trim() ?? name;
  const body = raw.replace(/^#\s+.+\n+/, "");
  const description = /^(?!#|[-*>\d])(.{20,})$/m.exec(body)?.[1]?.trim().slice(0, 160);
  return { title, description, html: marked.parse(body, { async: false }) as string };
}
