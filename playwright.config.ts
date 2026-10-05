import {existsSync} from 'node:fs'
import {defineConfig} from '@playwright/test'

const hasAdsBuild = existsSync('web/out-ads')

// Testy działają na zbudowanym `web/out` serwowanym lokalnie. Używają zainstalowanego Chrome
// (kanał `chrome`), więc nie trzeba pobierać przeglądarek Playwrighta.
export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  reporter: 'list',
  use: {baseURL: 'http://localhost:4173', channel: 'chrome'},
  webServer: [
    {command: 'node scripts/serve-out.mjs', url: 'http://localhost:4173/pl/', reuseExistingServer: true},
    // wariant z włączoną warstwą zgód (pnpm --filter web build:ads); bez katalogu testy consent-on są pomijane
    ...(hasAdsBuild
      ? [{command: 'OUT_DIR=out-ads PORT=4174 node scripts/serve-out.mjs', url: 'http://localhost:4174/pl/', reuseExistingServer: true}]
      : []),
  ],
})
