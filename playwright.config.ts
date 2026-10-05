import {defineConfig} from '@playwright/test'

// Testy działają na zbudowanym `web/out` serwowanym lokalnie. Używają zainstalowanego Chrome
// (kanał `chrome`), więc nie trzeba pobierać przeglądarek Playwrighta.
export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  reporter: 'list',
  use: {baseURL: 'http://localhost:4173', channel: 'chrome'},
  webServer: {command: 'node scripts/serve-out.mjs', url: 'http://localhost:4173/pl/', reuseExistingServer: true},
})
