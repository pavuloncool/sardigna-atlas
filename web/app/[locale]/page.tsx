import { ArticleCard } from "@/components/ArticleCard";
import { PageShell } from "@/components/PageShell";
import { Prose } from "@/components/Prose";
import { isLocale } from "@/lib/i18n/locales";
import { notFound } from "next/navigation";

// Tymczasowa strona główna fazy 1: pokazuje komponenty design systemu.
// Faza 3 zastępuje ją właściwym home (hero, Opowieści, działy, mapa).
const sample = [
  { _id: "a", title: "[PLACEHOLDER] Tytuł artykułu", slug: "x", excerpt: "[PLACEHOLDER] Zajawka artykułu w dwóch zdaniach.", category: { name: "Kulinaria", slug: "kulinaria" } },
  { _id: "b", title: "[PLACEHOLDER] Drugi tytuł", slug: "y", excerpt: "[PLACEHOLDER] Zajawka artykułu w dwóch zdaniach.", category: { name: "Rękodzieło", slug: "rekodzielo" } },
];

const body = [
  { _type: "block", _key: "1", style: "h2", markDefs: [], children: [{ _type: "span", _key: "s", text: "[PLACEHOLDER] Nagłówek", marks: [] }] },
  { _type: "block", _key: "2", style: "normal", markDefs: [{ _key: "l", _type: "link", href: "https://example.com" }], children: [{ _type: "span", _key: "s", text: "[PLACEHOLDER] Akapit z ", marks: [] }, { _type: "span", _key: "t", text: "linkiem", marks: ["l"] }, { _type: "span", _key: "u", text: ".", marks: [] }] },
  { _type: "pullQuote", _key: "3", quote: "[PLACEHOLDER] Cytat wyróżniony.", attribution: "[PLACEHOLDER]" },
];

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <PageShell locale={locale}>
      <h1 className="sr">SARDIGNA. Su Mari. S&apos;Isula. Sa Bida.</h1>
      <section id="opowiesci" className="container" style={{ display: "grid", gap: "4rem", paddingBlock: "8vh" }}>
        <h2 className="sr">Opowieści</h2>
        {sample.map((a, i) => (
          <ArticleCard key={a._id} article={a} locale={locale} ratio={i ? 2.27 : 1.93} fallback={i ? ["var(--kobalt)", "var(--morze)"] : ["var(--terakota)", "var(--ochra)"]} />
        ))}
        <Prose value={body as never} locale={locale} />
      </section>
    </PageShell>
  );
}
