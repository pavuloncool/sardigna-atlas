/**
 * Tworzy dokumenty `place` (kind: region) dla regionów z mapy Atlasu, których jeszcze nie ma
 * w datasecie. Nie nadpisuje istniejących (pomija region z tym samym `mapId` lub `_id`),
 * więc jest bezpieczny przy ręcznie edytowanych treściach. Uruchomienie (z folderu studio):
 *   sanity exec scripts/create-regions.ts --with-user-token
 * Dokumenty powstają jako opublikowane, bez opisu i zdjęcia (do uzupełnienia w Studio).
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-02-19'})

const REGIONS: [mapId: string, name: string][] = [
  ['nurra', 'Nurra'],
  ['gallura', 'Gallura'],
  ['logudoro', 'Logudoro'],
  ['oristano', 'Oristano'],
  ['baronia', 'Baronìa'],
  ['barbagia', 'Barbagia'],
  ['ogliastra', 'Ogliastra'],
  ['campidano', 'Campidano'],
  ['sulcis', 'Sulcis'],
  ['sarrabus', 'Sarrabus'],
]

const existing = await client.fetch<{_id: string; mapId?: string; slug?: string}[]>(
  `*[_type == "place" && (kind == "region" || defined(mapId)) && !(_id in path("drafts.**"))]{_id, mapId, "slug": slug.current}`,
)
const tx = client.transaction()
let n = 0
for (const [mapId, name] of REGIONS) {
  const hit = existing.find((e) => e.mapId === mapId || e.slug === mapId)
  if (hit) {
    console.log(`jest: ${name} (${hit._id}), pomijam`)
    continue
  }
  tx.createIfNotExists({
    _id: `place-region-${mapId}`,
    _type: 'place',
    name: {pl: name, en: name},
    slug: {_type: 'slug', current: mapId},
    kind: 'region',
    mapId,
  })
  console.log(`tworzę: ${name} (place-region-${mapId})`)
  n++
}
if (n) await tx.commit()
console.log(`gotowe, utworzono: ${n}`)
