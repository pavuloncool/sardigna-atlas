/**
 * Generuje `scripts/seed/out/seed.ndjson` + obrazy-gradienty (PNG).
 * Użycie: `pnpm seed:build`, potem `pnpm seed:import` (zapis do datasetu — tylko za zgodą).
 */
import {mkdirSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {buildDocuments, IMAGE_KEYS, type ImageKey} from './data.ts'
import {gradientPng} from './png.ts'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, 'out')
mkdirSync(join(out, 'images'), {recursive: true})

for (const [key, [from, to]] of Object.entries(IMAGE_KEYS)) {
  writeFileSync(join(out, 'images', `${key}.png`), gradientPng(from, to))
}

const docs = buildDocuments((key) => ({
  _sanityAsset: `image@file://${join(out, 'images', `${key as ImageKey}.png`)}`,
}))

writeFileSync(join(out, 'seed.ndjson'), docs.map((d) => JSON.stringify(d)).join('\n') + '\n')
console.log(`seed: ${docs.length} dokumentów, ${Object.keys(IMAGE_KEYS).length} obrazów → ${out}`)
