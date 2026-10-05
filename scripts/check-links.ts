/**
 * Crawler martwych linków na zbudowanym `web/out`: każdy wewnętrzny href/src musi wskazywać
 * istniejący plik, a fragment (#id) istniejący element. Użycie: `pnpm test:links` (po `pnpm build`).
 */
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs'
import {dirname, join, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../web/out')
if (!existsSync(out)) throw new Error('Brak web/out — najpierw `pnpm build`.')

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

const files = walk(out)
const pages = files.filter((f) => f.endsWith('.html'))
const ids = new Map<string, Set<string>>()
const idsOf = (file: string) => {
  if (!ids.has(file)) {
    const html = readFileSync(file, 'utf8')
    ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])))
  }
  return ids.get(file)!
}

/** Ścieżka URL → plik w out (katalog → index.html). */
function resolveUrl(pathname: string): string | null {
  const clean = decodeURIComponent(pathname)
  const candidates = clean.endsWith('/')
    ? [join(out, clean, 'index.html')]
    : [join(out, clean), join(out, clean + '.html'), join(out, clean, 'index.html')]
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null
}

const problems: string[] = []
let checked = 0

for (const page of pages) {
  if (page.includes('/pagefind/')) continue
  const pageUrl = '/' + relative(out, page).replace(/index\.html$/, '')
  const html = readFileSync(page, 'utf8')
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&'))

  for (const ref of refs) {
    if (!ref || /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(ref)) continue
    const url = new URL(ref, 'http://x' + pageUrl)
    checked++
    const target = resolveUrl(url.pathname)
    if (!target) {
      problems.push(`${pageUrl} → ${ref} (brak pliku)`)
      continue
    }
    if (url.hash.length > 1 && target.endsWith('.html')) {
      const id = decodeURIComponent(url.hash.slice(1))
      if (id !== 'top' && !idsOf(target).has(id)) problems.push(`${pageUrl} → ${ref} (brak elementu #${id})`)
    }
  }
}

console.log(`Sprawdzono ${checked} odnośników na ${pages.length} stronach.`)
if (problems.length) {
  console.log(`\nMartwe linki (${problems.length}):`)
  for (const p of [...new Set(problems)]) console.log(' -', p)
  process.exit(1)
}
console.log('Brak martwych linków.')
