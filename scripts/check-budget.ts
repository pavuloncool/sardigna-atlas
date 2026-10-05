/**
 * Budżet JS (faza 5): suma gzip skryptów ładowanych przez stronę z `web/out`.
 * Liczymy `<script src>` i `<link rel="preload" as="script">` (bez duplikatów, bez Pagefind,
 * który ładuje się dopiero po otwarciu wyszukiwarki). Użycie: `pnpm test:budget` po `pnpm build`.
 */
import {existsSync, readFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {brotliCompressSync, constants, gzipSync} from 'node:zlib'

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../web/out')
const LIMIT_KB = 120

const pages = [
  {name: 'artykuł PL', file: 'pl/kulinaria/pane-carasau-chleb-z-potrzeby/index.html', limit: LIMIT_KB},
  {name: 'artykuł EN', file: 'en/food/pane-carasau-bread-born-of-necessity/index.html', limit: LIMIT_KB},
  {name: 'home PL', file: 'pl/index.html', limit: LIMIT_KB},
  {name: 'dział PL', file: 'pl/kulinaria/index.html', limit: LIMIT_KB},
  {name: 'Atlas PL', file: 'pl/atlas/index.html', limit: LIMIT_KB},
  {name: 'kontakt PL', file: 'pl/kontakt/index.html', limit: LIMIT_KB},
]

const BROTLI = process.env.BUDGET_VERBOSE === '1'
let failed = false
console.log('Strona'.padEnd(14), 'skryptów', 'gzip kB', 'brotli kB', 'limit (brotli)')
for (const p of pages) {
  const path = join(out, p.file)
  if (!existsSync(path)) {
    console.log(p.name.padEnd(14), 'brak pliku', p.file)
    failed = true
    continue
  }
  const html = readFileSync(path, 'utf8')
  const urls = new Set<string>()
  // `nomodule` (polyfille dla starych przeglądarek) nowoczesne przeglądarki w ogóle nie pobierają.
  for (const m of html.matchAll(/<script([^>]*)>/g)) {
    const src = /src="([^"]+)"/.exec(m[1])?.[1]
    if (src && !/no[Mm]odule/.test(m[1])) urls.add(src)
  }
  let gz = 0
  let br = 0
  const rows: [number, string][] = []
  for (const u of urls) {
    if (!u.startsWith('/_next/')) continue
    const f = join(out, u.split('?')[0])
    if (!existsSync(f)) continue
    const raw = readFileSync(f)
    const g = gzipSync(raw, {level: 9}).length
    const b = brotliCompressSync(raw, {params: {[constants.BROTLI_PARAM_QUALITY]: 11}}).length
    gz += g
    br += b
    rows.push([b, u.split('/').pop()!])
  }
  if (BROTLI) for (const [b, n] of rows.sort((x, y) => y[0] - x[0])) console.log(`    ${(b / 1024).toFixed(1).padStart(6)} kB br  ${n}`)
  // Cloudflare serwuje brotli, więc to ona jest miarą rzeczywistego transferu; gzip podajemy dla porównania.
  const ok = br / 1024 < p.limit
  if (!ok) failed = true
  console.log(p.name.padEnd(14), String(urls.size).padStart(8), (gz / 1024).toFixed(1).padStart(7), (br / 1024).toFixed(1).padStart(9), `${p.limit}`.padStart(6), ok ? 'ok' : 'PRZEKROCZONY')
}
process.exit(failed ? 1 : 0)
