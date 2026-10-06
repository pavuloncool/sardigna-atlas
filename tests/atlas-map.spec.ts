import {expect, test} from '@playwright/test'

// Mapa 29 subregionów. Wymaganie właściciela: żadnych szarych (wygaszonych) obszarów, czyli każdy
// subregion ma dokument `place` z `mapId` w Sanity (studio/scripts/sync-regions.ts) i jest linkiem.
const COUNT = 29

test.beforeEach(async ({page}) => {
  await page.goto('/pl/atlas/')
})

test('mapa rysuje 29 subregionów, wszystkie klikalne, bez szarych obszarów', async ({page}) => {
  const map = page.locator('.atlas-map')
  await expect(map.locator('path.region')).toHaveCount(COUNT)
  await expect(map.locator('a.region-link')).toHaveCount(COUNT)
  await expect(map.locator('path.region.soon')).toHaveCount(0)
  await expect(map.locator('.map-legend li')).toHaveCount(COUNT)
  await expect(map.locator('.map-legend li.soon')).toHaveCount(0)
  await expect(map.locator('.map-source')).toContainText('ISTAT')
})

test('hover pokazuje tooltip z pełną nazwą i liczbą artykułów, zjazd myszą go chowa', async ({page}) => {
  const monreale = page.locator('.atlas-map a.region-link[data-id="monreale"]')
  await monreale.locator('path').hover()
  await expect(page.locator('.map-tip')).toHaveText(/^Monreale \(Campidano di Sanluri\) · \d+ artyku/)
  await page.mouse.move(2, 2)
  await expect(page.locator('.map-tip')).toHaveCount(0)
})

test('subregion bez etykiety na mapie (Quirra) ma tooltip', async ({page}) => {
  await page.locator('.atlas-map a.region-link[data-id="quirra"] path').hover()
  await expect(page.locator('.map-tip')).toContainText('Quirra')
})

test('klawiatura: fokus pokazuje tooltip, Escape go chowa', async ({page}) => {
  const first = page.locator('.atlas-map a.region-link').first()
  await first.focus()
  await expect(page.locator('.map-tip')).toHaveText((await first.getAttribute('aria-label'))!)
  await page.keyboard.press('Escape')
  await expect(page.locator('.map-tip')).toHaveCount(0)
})

test('klik w subregion prowadzi do strony miejsca, hover podświetla legendę', async ({page}) => {
  const link = page.locator('.atlas-map a.region-link').first()
  await link.locator('path').hover()
  await expect(page.locator('.map-legend li.is-active')).toHaveCount(1)
  const href = await link.getAttribute('href')
  expect(href).toMatch(/^\/pl\/atlas\/[^/]+\/[^/]+\/$/)
  await link.locator('path').click()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
})
