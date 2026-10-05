import { locales } from "@/lib/i18n/locales";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  return <main>Sardigna Atlas — {locale}</main>;
}
