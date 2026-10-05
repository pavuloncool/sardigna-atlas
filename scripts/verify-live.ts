/**
 * Te same zapytania na żywym datasecie (perspektywa `published`, tylko odczyt).
 * Użycie: `pnpm verify:live`. AC fazy 2: każde zapytanie z queries.ts zwraca dane na seedzie.
 */
import {createClient} from '@sanity/client'
import {cases} from './cases.ts'
import * as Q from '../web/lib/sanity/queries.ts'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID ?? 'rkr99tu3',
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2025-02-19',
  useCdn: false,
  perspective: 'published',
})

let failures = 0
const check = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`)
  if (!ok) {
    failures++
    if (detail !== undefined) console.log('     ', JSON.stringify(detail).slice(0, 400))
  }
}
const nonEmpty = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v != null)

for (const [name, q, params] of cases) {
  const r = await client.fetch(q, params)
  check(`${name} zwraca dane`, nonEmpty(r), r)
}

const art = await client.fetch(Q.articleBySlugQuery, {lang: 'pl', slug: 'pane-carasau-chleb-z-potrzeby'})
check('artykuł PL: translations zawiera en', art?.translations?.some((t: any) => t.language === 'en'), art?.translations)
check('artykuł: hero ma LQIP i wymiary', Boolean(art?.heroImage?.lqip && art?.heroImage?.width), art?.heroImage)
check('artykuł: entityLink rozwinięty w treści', JSON.stringify(art?.body).includes('"target":{"_type":"place"'), art?.body?.[1])
const place = await client.fetch(Q.placeBySlugQuery, {lang: 'pl', slug: 'barbagia', limit: 12})
check('region agreguje 2 artykuły z drzewa potomków', place?.articles?.length === 2, place?.articles?.length)
const rel: any[] = (await client.fetch(Q.relatedQuery, {lang: 'pl', id: 'seed-article-pane-pl', limit: 6})) ?? []
const d = rel.map((x) => x.date as string)
check('related: najnowsze najpierw, bez bieżącego, niepusty', d.length > 1 && d.every((v, i) => i === 0 || d[i - 1] >= v) && !rel.some((x) => x._id === 'seed-article-pane-pl'), rel.map((x) => x._id))
const hotel: any = (await client.fetch(Q.placeBySlugQuery, {lang: 'pl', slug: 'nuoro', limit: 12}))?.hotels?.[0]
check('hotel: pola afiliacyjne w projekcji', hotel?.affiliateUrl?.startsWith('https://') && hotel?.isAffiliate === true, hotel)

console.log(failures ? `\n${failures} niepowodzeń` : '\nWszystkie testy live przeszły')
process.exit(failures ? 1 : 0)
