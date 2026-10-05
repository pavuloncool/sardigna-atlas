import {expect, test, type Page} from '@playwright/test'

/**
 * Faza 7, flaga NEXT_PUBLIC_ADS_ENABLED=false (build produkcyjny 1.0, `web/out`): zero żądań do domen
 * Google i partnerów, brak banera, brak cookies. Dozwolone: własna domena, cdn.sanity.io oraz analityka
 * Cloudflare (wstrzykiwana przez Pages, lokalnie jej nie ma). Turnstile dopiero po interakcji na /kontakt/.
 */
const ALLOWED = (host: string) =>
  host === 'localhost' || host === 'cdn.sanity.io' || host.endsWith('cloudflareinsights.com')
const THIRD_PARTY_ADS = /google|doubleclick|gstatic|googlesyndication|googletagmanager|adservice|adsbygoogle/i

function watch(page: Page) {
  const hosts = new Set<string>()
  const bodies: string[] = []
  page.on('request', (r) => hosts.add(new URL(r.url()).hostname))
  page.on('response', async (r) => {
    if (r.url().endsWith('.js')) bodies.push(await r.text().catch(() => ''))
  })
  return {hosts, bodies}
}

const pages = ['/pl/', '/en/', '/pl/atlas/', '/pl/autorzy/', '/pl/polityka-prywatnosci/', '/pl/polityka-cookies/']

for (const path of pages) {
  test(`flaga false: ${path} nie łączy się z Google ani partnerami`, async ({page}) => {
    const {hosts, bodies} = watch(page)
    await page.goto(path, {waitUntil: 'networkidle'})
    for (const h of hosts) {
      expect(ALLOWED(h), `niedozwolony host: ${h}`).toBe(true)
      expect(h).not.toMatch(THIRD_PARTY_ADS)
    }
    await expect(page.locator('[data-consent-banner]')).toHaveCount(0)
    expect(await page.evaluate(() => document.cookie)).toBe('')
    // warstwa zgód nie istnieje w runtime: brak dataLayer/gtag
    expect(await page.evaluate(() => 'dataLayer' in window || 'gtag' in window)).toBe(false)
    // i nie ma jej w paczkach JS (gałąź usunięta w buildzie)
    for (const b of bodies) expect(b).not.toMatch(/googlesyndication|adsbygoogle\.js|consent\.v1/)
  })
}

test('flaga false: artykuł z sitemap też bez Google', async ({page}) => {
  const xml = await (await page.request.get('/sitemap.xml')).text()
  const article = [...xml.matchAll(/<loc>[^<]*?(\/pl\/(?:kulinaria|rekodzielo|historia|ludzie)\/[^/<]+\/)<\/loc>/g)][0]?.[1]
  expect(article).toBeTruthy()
  const {hosts} = watch(page)
  await page.goto(article, {waitUntil: 'networkidle'})
  for (const h of hosts) expect(ALLOWED(h), `niedozwolony host: ${h}`).toBe(true)
})

test('flaga false: Turnstile ładuje się dopiero po interakcji z formularzem', async ({page}) => {
  const {hosts} = watch(page)
  await page.goto('/pl/kontakt/', {waitUntil: 'networkidle'})
  expect([...hosts].some((h) => h.includes('challenges.cloudflare.com'))).toBe(false)
  await page.locator('.contact-form input, .contact-form textarea').first().focus()
  await expect.poll(() => [...hosts].some((h) => h === 'challenges.cloudflare.com')).toBe(true)
  for (const h of hosts) expect(h).not.toMatch(THIRD_PARTY_ADS)
})

test('ads.txt jest dostępny i zawiera placeholder', async ({page}) => {
  const res = await page.request.get('/ads.txt')
  expect(res.status()).toBe(200)
  expect(await res.text()).toContain('[PLACEHOLDER]')
})
