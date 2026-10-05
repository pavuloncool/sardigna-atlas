// Minimalny serwer statyczny dla `web/out` (bez zależności): katalog → index.html, /404.html dla braków.
import {createServer} from 'node:http'
import {existsSync, readFileSync, statSync} from 'node:fs'
import {extname, join, normalize, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(fileURLToPath(new URL(`../web/${process.env.OUT_DIR ?? 'out'}`, import.meta.url)))
const port = Number(process.env.PORT ?? 4173)
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.pf_meta': 'application/octet-stream'}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = normalize(join(root, path))
  if (!file.startsWith(root)) return res.writeHead(403).end()
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  else if (!existsSync(file) && existsSync(file + '.html')) file += '.html'
  if (!existsSync(file)) {
    res.writeHead(404, {'Content-Type': types['.html']})
    return res.end(existsSync(join(root, '404.html')) ? readFileSync(join(root, '404.html')) : 'Not found')
  }
  res.writeHead(200, {'Content-Type': types[extname(file)] ?? 'application/octet-stream'})
  res.end(readFileSync(file))
}).listen(port, () => console.log(`out/ → http://localhost:${port}`))
