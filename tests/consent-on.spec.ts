import {existsSync} from 'node:fs'
import {expect, test, type Page} from '@playwright/test'

/**
 * Faza 7, flaga NEXT_PUBLIC_ADS_ENABLED=true (build testowy `pnpm --filter web build:ads` → `web/out-ads`,
 * port 4174): baner, Consent Mode v2 `denied` domyślnie, a skrypt AdSense wyłącznie po akceptacji.
 */
test.skip(!existsSync('web/out-ads'), 'brak web/out-ads (pnpm --filter web build:ads)')

const BASE = 'http://localhost:4174'
const GOOGLE = /googlesyndication|doubleclick|googletagmanager|google-analytics/

async function open(page: Page, path = '/pl/') {
  const google: string[] = []
  page.on('request', (r) => {
    if (GOOGLE.test(r.url())) google.push(r.url())
  })
  await page.route(GOOGLE, (r) => r.abort()) // nie łączymy się naprawdę; samo żądanie jest zliczone
  await page.goto(BASE + path, {waitUntil: 'networkidle'})
  return google
}

const dataLayer = (page: Page) =>
  page.evaluate(() => (window as unknown as {dataLayer: ArrayLike<unknown>[]}).dataLayer.map((a) => Array.from(a)))

test('baner pojawia się, Consent Mode startuje jako denied, zero żądań do Google przed wyborem', async ({page}) => {
  const google = await open(page)
  const banner = page.locator('[data-consent-banner]')
  await expect(banner).toBeVisible()
  const dl = await dataLayer(page)
  expect(dl[0]).toEqual([
    'consent',
    'default',
    {ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500},
  ])
  expect(google).toEqual([])
  // odmowa równie łatwa jak zgoda
  await expect(banner.getByRole('button')).toHaveCount(2)
})

test('odrzucenie: brak skryptu Google, wybór zapamiętany po przeładowaniu', async ({page}) => {
  const google = await open(page)
  await page.getByRole('button', {name: 'Odrzucam'}).click()
  await expect(page.locator('[data-consent-banner]')).toHaveCount(0)
  await page.reload({waitUntil: 'networkidle'})
  await expect(page.locator('[data-consent-banner]')).toHaveCount(0)
  expect(google).toEqual([])
  const update = (await dataLayer(page)).find((a) => a[0] === 'consent' && a[1] === 'update')
  expect(update?.[2]).toMatchObject({ad_storage: 'denied', analytics_storage: 'denied'})
})

test('akceptacja: dopiero teraz ładuje się skrypt AdSense, Consent Mode granted', async ({page}) => {
  const google = await open(page)
  expect(google).toEqual([])
  await page.getByRole('button', {name: 'Akceptuję'}).click()
  await expect.poll(() => google.length).toBeGreaterThan(0)
  expect(google[0]).toContain('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1111111111111111')
  const update = (await dataLayer(page)).find((a) => a[0] === 'consent' && a[1] === 'update')
  expect(update?.[2]).toMatchObject({ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted'})
})

test('stopka: „Ustawienia zgód” otwierają baner ponownie', async ({page}) => {
  await open(page)
  await page.getByRole('button', {name: 'Odrzucam'}).click()
  await page.getByRole('button', {name: 'Ustawienia zgód'}).click()
  await expect(page.locator('[data-consent-banner]')).toBeVisible()
})
