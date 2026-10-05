import { notFound } from "next/navigation";
import { Figure } from "@/components/Figure";
import { Hero, type HeroColumn } from "@/components/Hero";
import { PageShell } from "@/components/PageShell";
import { getDictionary } from "@/lib/i18n/dictionary";
import { categoryPath } from "@/lib/i18n/categorySlugs";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { pagePath, type SegmentKey } from "@/lib/i18n/segments";
import homeEn from "@/content/home.en.json";
import homePl from "@/content/home.pl.json";

type Target = { segment: string } | { category: string };
type HomeContent = Omit<typeof homePl, "columns"> & {
  columns: { word: string; text: string; links: { label: string; to: Target }[] }[];
};

// Treść trzech kolumn w repo (migracja do Sanity w wersji 2). Brakujący język → polski.
const content: Partial<Record<Locale, HomeContent>> = { pl: homePl as HomeContent, en: homeEn as HomeContent };

const hrefFor = (to: Target, locale: Locale) =>
  "segment" in to ? pagePath(locale, to.segment as SegmentKey) : categoryPath(to.category, locale);

// Placeholdery zdjęć (jednolite gradienty) do czasu podpięcia artykułów z Sanity (faza 3).
const GRADIENTS: [string, string][] = [
  ["#c8501f", "#d99a2b"],
  ["#2b5c9e", "#4f9aa8"],
];
const WIDE_GRADIENT: [string, string] = ["#8f8a7e", "#c9b08a"];

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const home = content[locale] ?? homePl;
  const columns: HeroColumn[] = home.columns.map((c) => ({
    word: c.word,
    text: c.text,
    links: c.links.map((l) => ({ label: l.label, href: hrefFor(l.to, locale) })),
  }));

  return (
    <PageShell locale={locale} flush>
      <h1 className="sr">{dict.brand}</h1>
      <Hero columns={columns} />

      <section className="voices" id="opowiesci" aria-label={home.voicesAria}>
        {home.cards.map((card, i) => (
          <article className="card" key={card.title}>
            <Figure ratio={i === 0 ? 1.93 : 2.27} fallback={GRADIENTS[i]} label={card.label} />
            <h3>
              <a href="#">{card.title}</a>
              <span>{card.category}</span>
            </h3>
            <p>{card.excerpt}</p>
          </article>
        ))}
      </section>
      <div className="wide">
        <Figure ratio={2.4} fallback={WIDE_GRADIENT} label={home.wideLabel} />
      </div>
    </PageShell>
  );
}
