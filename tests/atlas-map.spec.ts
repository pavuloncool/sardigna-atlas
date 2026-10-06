import {expect, test} from '@playwright/test'

// Treści regionów w Sanity są edytowane, więc testy nie zakładają, które regiony mają stronę:
// sprawdzają zachowanie dla jednostki z linkiem (jeśli jest), bez linku i dla „innej krainy”.
const REGIONS = ['Nurra', 'Gallura', 'Logudoro', 'Oristano', 'Baronìa', 'Barbagia', 'Ogliastra', 'Campidano', 'Sulcis', 'Sarrabus']

test.beforeEach(async ({page}) => {
  await page.goto('/pl/atlas/')
})

test('mapa rysuje 10 regionów i szare inne krainy', async ({page}) => {
  const map = page.locator('.atlas-map')
  await expect(map.locator('path.region')).toHaveCount(17)
  await expect(map.locator('path.region.other')).toHaveCount(7)
  for (const name of REGIONS) await expect(map.locator('.region-names text', {hasText: new RegExp(`^${name}$`)})).toHaveCount(1)
  await expect(map.locator('.map-legend li')).toHaveCount(10)
  await expect(map.locator('.map-source')).toContainText('ISTAT')
})

test('hover na innej krainie pokazuje tooltip z jej nazwą', async ({page}) => {
  const marmilla = page.locator('.atlas-map g.region-static[aria-label^="Marmilla"]')
  await marmilla.locator('path').hover()
  await expect(page.locator('.map-tip')).toHaveText('Marmilla · inna kraina')
  await page.mouse.move(2, 2)
  await expect(page.locator('.map-tip')).toHaveCount(0)
})

test('klawiatura: fokus pokazuje tooltip, Escape go chowa', async ({page}) => {
  const first = page.locator('.atlas-map a.region-link, .atlas-map g.region-static').first()
  await first.focus()
  const label = await first.getAttribute('aria-label')
  await expect(page.locator('.map-tip')).toHaveText(label!)
  await page.keyboard.press('Escape')
  await expect(page.locator('.map-tip')).toHaveCount(0)
})

test('region bez strony jest nieklikalny i ma „wkrótce”, region ze stroną prowadzi do encji', async ({page}) => {
  const links = page.locator('.atlas-map a.region-link')
  const soon = page.locator('.atlas-map path.region.soon')
  expect((await links.count()) + (await soon.count())).toBe(10)
  if (await soon.count()) {
    await soon.first().hover()
    await expect(page.locator('.map-tip')).toContainText('wkrótce')
  }
  if (await links.count()) {
    const href = await links.first().getAttribute('href')
    expect(href).toMatch(/^\/pl\/atlas\/[^/]+\/[^/]+\/$/)
    await links.first().locator('path').click()
    await expect(page).toHaveURL(new RegExp(`${href}$`))
  }
})

test('hover na regionie podświetla pozycję w legendzie', async ({page}) => {
  const link = page.locator('.atlas-map a.region-link').first()
  if (!(await link.count())) test.skip(true, 'żaden region nie ma jeszcze strony w Sanity')
  await link.locator('path').hover()
  await expect(page.locator('.map-legend li.is-active')).toHaveCount(1)
})
