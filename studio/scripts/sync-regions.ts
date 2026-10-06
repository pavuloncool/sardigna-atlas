/**
 * Synchronizuje dokumenty `place` (kind: region) z subregionami mapy Atlasu
 * (`scripts/map/subregions.csv`: id = `mapId`, nazwa, z niej slug). Uruchomienie (z folderu studio):
 *   DRY_RUN=1 sanity exec scripts/sync-regions.ts --with-user-token   # tylko plan zmian
 *   sanity exec scripts/sync-regions.ts --with-user-token
 *
 * - dokument z `mapId` z listy zostaje (opis, zdjęcie i powiązania nietknięte);
 * - dawne regiony z RENAMES dostają nową nazwę, slug i `mapId` w tym samym dokumencie;
 * - dokument z `mapId` spoza listy: usuwany, jeśli nic do niego nie linkuje, inaczej traci `mapId`;
 * - brakujące subregiony są tworzone (opublikowane, bez opisu i zdjęcia).
 * Idempotentny: drugie uruchomienie nic nie zmienia.
 */
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-02-19'})
const dry = Boolean(process.env.DRY_RUN)

/** Dawne `mapId` (10 regionów) → subregion, którym staje się ten sam dokument. */
const RENAMES: Record<string, string> = {
  baronia: 'baronie',
  sulcis: 'sulcis-iglesiente',
  sarrabus: 'sarrabus-gerrei',
  barbagia: 'barbagia-di-nuoro',
}

const csv = readFileSync(resolve(process.cwd(), '../scripts/map/subregions.csv'), 'utf8').trim().split('\n').slice(1)
const subs = csv.map((line) => {
  const [id, , name] = line.split(',')
  return {id, name}
})
const wanted = new Map(subs.map((s) => [s.id, s]))

type Doc = {_id: string; name?: {pl?: string; en?: string}; mapId?: string; slug?: string; refs: number}
const docs = await client.fetch<Doc[]>(
  `*[_type == "place" && (kind == "region" || defined(mapId)) && !(_id in path("drafts.**"))]{
    _id, name, mapId, "slug": slug.current, "refs": count(*[references(^._id)])
  }`,
)
const drafts = await client.fetch<string[]>(`*[_type == "place" && _id in path("drafts.**") && defined(mapId)]._id`)
if (drafts.length) console.log(`UWAGA: szkice z mapId (nie są zmieniane): ${drafts.join(', ')}`)
const slugs = new Set(await client.fetch<string[]>(`*[_type == "place" && !(_id in path("drafts.**"))].slug.current`))

const tx = client.transaction()
const log: string[] = []
const covered = new Set<string>()

for (const d of docs) {
  const target = d.mapId && wanted.has(d.mapId) ? d.mapId : d.mapId ? RENAMES[d.mapId] : undefined
  if (target && !covered.has(target)) {
    covered.add(target)
    const s = wanted.get(target)!
    if (d.mapId === target && d.slug === target) continue
    if (d.slug !== target && slugs.has(target)) throw new Error(`Slug ${target} jest już zajęty`)
    tx.patch(d._id, (p) => p.set({mapId: target, kind: 'region', slug: {_type: 'slug', current: target}, 'name.pl': s.name, 'name.en': s.name}))
    log.push(`zmiana: ${d.name?.pl} (${d._id}) → ${s.name} [${target}]`)
    continue
  }
  if (!d.mapId) continue
  if (d.refs === 0) {
    tx.delete(d._id)
    log.push(`usunięcie: ${d.name?.pl} (${d._id}), brak powiązań`)
  } else {
    tx.patch(d._id, (p) => p.unset(['mapId']))
    log.push(`bez mapId: ${d.name?.pl} (${d._id}), ma ${d.refs} powiązań, zostaje`)
  }
}
for (const s of subs) {
  if (covered.has(s.id)) continue
  if (slugs.has(s.id)) throw new Error(`Slug ${s.id} jest już zajęty przez inne miejsce`)
  tx.createIfNotExists({
    _id: `place-region-${s.id}`,
    _type: 'place',
    name: {pl: s.name, en: s.name},
    slug: {_type: 'slug', current: s.id},
    kind: 'region',
    mapId: s.id,
  })
  log.push(`nowy: ${s.name} [${s.id}]`)
}

console.log(log.length ? log.join('\n') : 'bez zmian')
if (!dry && log.length) {
  await tx.commit()
  console.log(`zapisano ${log.length} zmian`)
} else if (dry) console.log('(DRY_RUN: nic nie zapisano)')
