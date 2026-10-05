import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeScript } from "@/components/ThemeScript";
import { sans, serif } from "@/lib/fonts";
import { isLocale, locales } from "@/lib/i18n/locales";
import { ADS_ENABLED, siteUrl } from "@/lib/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { pagePath } from "@/lib/i18n/segments";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Sardigna Atlas", template: "%s · Sardigna Atlas" },
  description: "Magazyn i atlas kulturowy o Sardynii.",
};

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = getDictionary(locale).consent;
  // etykiety banera tylko przy włączonej fladze; przy `false` warstwa zgód nie renderuje się wcale
  const labels = ADS_ENABLED ? { ...c, policyHref: pagePath(locale, "cookies") } : undefined;

  return (
    <html lang={locale} className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body id="top">
        {labels ? <ConsentProvider labels={labels}>{children}</ConsentProvider> : children}
      </body>
    </html>
  );
}
