/**
 * Webhook Sanity → Cloudflare Deploy Hook (faza 6): publikacja treści = jeden build.
 * Uruchomienie (z folderu studio), URL hooka z pliku/zmiennej (to sekret, nie commitować):
 *   DEPLOY_HOOK_URL="$(cat plik)" sanity exec scripts/create-webhook.ts --with-user-token
 * Skrypt jest idempotentny: istniejący webhook o tej nazwie jest aktualizowany, nie duplikowany.
 */
import {getCliClient} from 'sanity/cli'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'rkr99tu3'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const url = process.env.DEPLOY_HOOK_URL
if (!url) throw new Error('Brak DEPLOY_HOOK_URL')

const NAME = 'cloudflare-pages-rebuild'
// Typy dokumentów, które wpływają na zbudowaną stronę. `translation.metadata` = powiązania wersji językowych (hreflang).
const TYPES = [
  'article', 'place', 'person', 'product', 'hotel', 'experience', 'restaurant',
  'brand', 'author', 'category', 'tag', 'translation.metadata',
]
// Tylko opublikowane dokumenty (bez szkiców), zgodnie z briefem (sekcja 3, konsekwencja 1).
const filter = `_type in [${TYPES.map((t) => `"${t}"`).join(', ')}] && !(_id in path("drafts.**"))`

const client = getCliClient({apiVersion: '2021-10-04', useProjectHostname: false})
const base = `/hooks/projects/${projectId}`

type Hook = {id: string; name: string; url: string; dataset?: string}
const existing = (await client.request<Hook[]>({uri: base})).find((h) => h.name === NAME)

const body = {
  type: 'document',
  name: NAME,
  description: 'Przebudowa strony statycznej po publikacji treści (bez szkiców).',
  url,
  dataset,
  httpMethod: 'POST',
  includeDrafts: false,
  includeAllVersions: false,
  rule: {on: ['create', 'update', 'delete'], filter, projection: '{_id, _type}'},
  apiVersion: 'v2021-03-25',
}

if (existing) {
  await client.request({uri: `${base}/${existing.id}`, method: 'PUT', body})
  console.log(`zaktualizowano webhook ${NAME} (${existing.id})`)
} else {
  const created = await client.request<{id: string}>({uri: base, method: 'POST', body})
  console.log(`utworzono webhook ${NAME} (${created.id})`)
}
console.log('filtr:', filter)
