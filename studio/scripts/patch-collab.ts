/**
 * Łatka seeda „współpraca”: dodaje autora gościnnego, oznaczenie współpracy i sprzęt do
 * istniejących artykułów `seed-article-pane-*`, NIE nadpisując reszty pól (np. ręcznie
 * poprawionych tytułów). Idempotentna. Uruchomienie (z folderu studio):
 *   sanity exec scripts/patch-collab.ts --with-user-token
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-02-19'})
const ref = (id: string) => ({_type: 'reference', _ref: id})

for (const lang of ['pl', 'en'] as const) {
  const id = `seed-article-pane-${lang}`
  const doc = await client.getDocument<{products?: {_ref: string}[]}>(id)
  if (!doc) {
    console.log(`brak ${id}, pomijam`)
    continue
  }
  const hasEquipment = (doc.products ?? []).some((p) => p._ref === 'seed-product-sprzet')
  let patch = client.patch(id).set({
    author: ref('seed-author-tworca-a'),
    partnership: {
      type: 'collaboration',
      partners: [
        {_key: 'seed-brand-a', ...ref('seed-brand-a')},
        {_key: 'seed-author-tworca-a', ...ref('seed-author-tworca-a')},
      ],
      note: lang === 'pl' ? '[PLACEHOLDER] Informacja o współpracy.' : '[PLACEHOLDER] Collaboration note.',
    },
  })
  if (!hasEquipment) {
    patch = patch.setIfMissing({products: []}).insert('after', 'products[-1]', [{_key: 'seed-product-sprzet', ...ref('seed-product-sprzet')}])
  }
  await patch.commit()
  console.log(`zaktualizowano ${id}`)
}
