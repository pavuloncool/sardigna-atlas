/**
 * Test zapytań GROQ z web/lib/sanity/queries.ts na zbiorze seeda (w pamięci, groq-js).
 * Każde zapytanie ma zwrócić dane; dodatkowo sprawdzamy reguły bloku „Powiązane” (sekcja 5a).
 * Użycie: `pnpm verify:queries`.
 */
import {evaluate, parse} from 'groq-js'
import {cases} from './cases.ts'
import * as Q from '../web/lib/sanity/queries.ts'
import {buildDocuments, type Doc} from './seed/data.ts'

type Dataset = Doc[]
const base = (): Dataset =>
  buildDocuments((key) => ({asset: {_type: 'reference', _ref: `image-${key}`}})).map((d, i) => ({
    ...d,
    _createdAt: new Date(Date.UTC(2026, 8, 1, 0, i)).toISOString(),
  }))

let failures = 0
const check = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`)
  if (!ok) {
    failures++
    if (detail !== undefined) console.log('     ', JSON.stringify(detail).slice(0, 400))
  }
}

async function run(query: string, dataset: Dataset, params: Record<string, unknown> = {}) {
  const tree = parse(query, {params})
  return (await evaluate(tree, {dataset, params})).get()
}
const nonEmpty = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v != null)

const ds = base()
const main = async () => {
  // 1) każde zapytanie zwraca dane (oba języki tam, gdzie zależy od $lang)
  for (const [name, q, params] of cases) {
    const r = await run(q, ds, params)
    check(`${name} zwraca dane`, nonEmpty(r), r)
  }

  // 2) szczegóły zapytań dostarczonych
  const art: any = await run(Q.articleBySlugQuery, ds, {lang: 'pl', slug: 'pane-carasau-chleb-z-potrzeby'})
  check('artykuł PL: translations zawiera en', art.translations?.some((t: any) => t.language === 'en'), art.translations)
  const place: any = await run(Q.placeBySlugQuery, ds, {lang: 'pl', slug: 'barbagia-di-nuoro', limit: 12})
  check('region agreguje artykuły z całego drzewa (3 poziomy)', place.articles?.length === 2, place.articles)
  check('region ma dziecko Nuoro', place.children?.some((c: any) => c.slug === 'nuoro'), place.children)

  // 2b) współpraca: autor gościnny, oznaczenie, marka i sprzęt
  const art2: any = await run(Q.articleBySlugQuery, ds, {lang: 'pl', slug: 'pane-carasau-chleb-z-potrzeby'})
  check('artykuł: autor gościnny z rolą i informacją o współpracach', art2.author?.kind === 'guest' && !!art2.author?.role && !!art2.author?.disclosure, art2.author)
  check('artykuł: partnership = collaboration z partnerami', art2.partnership?.type === 'collaboration' && art2.partnership?.partners?.length === 2, art2.partnership)
  check('artykuł: sprzęt ma markę', art2.products?.some((p: any) => p.kind === 'equipment' && p.brand?.slug === 'marka-a'), art2.products)
  const auth: any = await run(Q.authorBySlugQuery, ds, {lang: 'pl', slug: 'tworca-a'})
  check('profil autora: artykuły w języku strony', auth?.articles?.length === 1 && auth.articles[0].slug === 'pane-carasau-chleb-z-potrzeby', auth?.articles)
  const authEn: any = await run(Q.authorBySlugQuery, ds, {lang: 'en', slug: 'tworca-a'})
  check('profil autora EN: rola po angielsku, artykuł EN', authEn?.role?.includes('food creator') && authEn.articles?.[0]?.language === 'en', authEn)
  const idx: any[] = (await run(Q.authorsIndexQuery, ds, {lang: 'pl'})) as any[]
  check('lista autorów: wyróżniony pierwszy, liczba artykułów', idx[0]?.slug === 'tworca-a' && idx[0]?.articleCount === 1 && idx.length === 2, idx.map((a) => [a.slug, a.articleCount]))
  const brand: any = await run(Q.entityHubQuery, ds, {lang: 'pl', type: 'brand', slug: 'marka-a'})
  check('marka: hub z logo, afiliacją i produktami', !!brand?.image && brand.affiliateUrl?.startsWith('https://') && brand.brandProducts?.some((p: any) => p.slug === 'sprzet-kuchenny'), brand)
  check('marka: artykuły powiązane przez partnerstwo', brand?.articles?.some((a: any) => a.slug === 'pane-carasau-chleb-z-potrzeby'), brand?.articles)

  // 3) relatedQuery (sekcja 5a)
  const related = async (id: string, lang = 'pl', limit = 6, data = ds): Promise<any[]> =>
    ((await run(Q.relatedQuery, data, {id, lang, limit})) as any[] | null) ?? []

  const r1 = await related('seed-article-pane-pl')
  check('related: bez bieżącego dokumentu', !r1.some((x) => x._id === 'seed-article-pane-pl'), r1.map((x) => x._id))
  check('related: artykuł EN nie pojawia się w PL', !r1.some((x) => x.language === 'en'), r1.map((x) => x._id))
  check('related: zawiera drugi artykuł PL (2 wspólne tagi)', r1.some((x) => x._id === 'seed-article-tkactwo-pl'), r1.map((x) => x._id))
  check('related: niepusty wynik', r1.length > 0, r1)
  const dates = r1.map((x) => x.date as string)
  check('related: kolejność od najnowszej', dates.length > 1 && dates.every((d, i) => i === 0 || dates[i - 1] >= d), dates)
  check('related: limit', (await related('seed-article-pane-pl', 'pl', 2)).length === 2)

  // brak tłumaczenia w bieżącym języku: encja z nazwą tylko po polsku znika z EN
  const noEn = base().map((d) => (d._id === 'seed-product-tkanina' ? {...d, name: {pl: 'Tkanina'}} : d))
  const rEn = await related('seed-article-tkactwo-en', 'en', 6, noEn)
  check('related: pozycja bez tłumaczenia w EN jest odfiltrowana', !rEn.some((x) => x._id === 'seed-product-tkanina'), rEn.map((x) => x._id))

  // przypięte na górze
  const pinned = base().map((d) => (d._id === 'seed-article-pane-pl' ? {...d, pinnedRelated: [{_type: 'reference', _ref: 'seed-article-tkactwo-pl'}]} : d))
  const rp = await related('seed-article-pane-pl', 'pl', 6, pinned)
  check('related: przypięte na górze, bez duplikatów', rp[0]?._id === 'seed-article-tkactwo-pl' && rp.filter((x) => x._id === 'seed-article-tkactwo-pl').length === 1, rp.map((x) => x._id))

  const rAll = await related('seed-article-pane-pl', 'pl', 30)
  check('related: marka partnerska jest kandydatem', rAll.some((x) => x._type === 'brand'), rAll.map((x) => x._type))

  // encja: strona miejsca zbiera artykuły, które do niej prowadzą
  const rPlace = await related('seed-place-orgosolo')
  check('related (encja): artykuły prowadzące do miejsca', rPlace.some((x) => x._type === 'article'), rPlace.map((x) => x._id))

  // AC: usunięcie tagów (i referencji) usuwa blok
  const only = (tags: string[]) => [
    {_id: 'x-a', _type: 'article', language: 'pl', title: 'A', slug: {current: 'a'}, publishedAt: '2026-09-01T00:00:00Z', tags: tags.map((t) => ({_type: 'reference', _ref: t}))},
    {_id: 'x-b', _type: 'article', language: 'pl', title: 'B', slug: {current: 'b'}, publishedAt: '2026-09-02T00:00:00Z', tags: tags.map((t) => ({_type: 'reference', _ref: t}))},
    {_id: 'x-c', _type: 'article', language: 'pl', title: 'C', slug: {current: 'c'}, publishedAt: '2026-09-03T00:00:00Z', tags: tags.map((t) => ({_type: 'reference', _ref: t}))},
  ] as Dataset
  const withTags = await related('x-a', 'pl', 6, only(['t1', 't2']))
  check('AC: dwa wspólne tagi → powiązane, najnowsze najpierw', withTags.map((x) => x._id).join() === 'x-c,x-b', withTags.map((x) => x._id))
  const noTags = await related('x-a', 'pl', 6, only([]))
  check('AC: bez tagów blok jest pusty (nie renderuje się)', noTags.length === 0, noTags)

  console.log(failures ? `\n${failures} niepowodzeń` : '\nWszystkie testy przeszły')
  process.exit(failures ? 1 : 0)
}
main()
