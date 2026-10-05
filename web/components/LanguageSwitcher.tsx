import Link from "@/components/Link";
import { ENABLED_LOCALES, type Locale } from "@/lib/i18n/locales";
import { format, getDictionary } from "@/lib/i18n/dictionary";
import { homePath } from "@/lib/i18n/segments";

/**
 * Prowadzi do tłumaczenia bieżącej strony (`alternates`), a gdy go nie ma,
 * do strony głównej drugiego języka (nigdy do 404).
 */
export function LanguageSwitcher({
  locale,
  alternates = {},
}: {
  locale: Locale;
  alternates?: Partial<Record<Locale, string>>;
}) {
  const dict = getDictionary(locale);
  const others = ENABLED_LOCALES.filter((l) => l.id !== locale);

  return (
    <div className="lang-switch" role="group" aria-label={dict.language.aria}>
      {others.map((l) => (
        <Link
          key={l.id}
          href={alternates[l.id] ?? homePath(l.id)}
          hrefLang={l.id}
          lang={l.id}
          aria-label={format(dict.language.switchTo, { language: l.title })}
        >
          {l.id.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
