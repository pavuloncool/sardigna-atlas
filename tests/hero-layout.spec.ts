import {expect, test} from '@playwright/test'

/**
 * Gwarancja układu hero (sekcja 7.3.7 briefu): obraz z „Opowieści” nie może wjechać na akapity
 * i linki kolumn, zanim będą w pełni widoczne (opacity = 1), a dół linków musi leżeć nad górą obrazu.
 */
const sizes = [
  {width: 1210, height: 420},
  {width: 1210, height: 540},
  {width: 1210, height: 700},
  {width: 1600, height: 900},
]

for (const size of sizes) {
  test(`hero ${size.width}×${size.height}: obraz nie zachodzi na kolumny`, async ({page}) => {
    await page.setViewportSize(size)
    await page.goto('/pl/')
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('html')).toHaveClass(/anim/)

    const total = await page.evaluate(() => document.documentElement.scrollHeight)
    let checked = 0
    for (let y = 0; y <= total - size.height; y += 20) {
      await page.evaluate((v) => scrollTo(0, v), y)
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      const state = await page.evaluate(() => {
        const vh = innerHeight
        const phs = [...document.querySelectorAll<HTMLElement>('.voices .ph')]
        const covering = phs.filter((p) => p.getBoundingClientRect().top < vh)
        const txt = [...document.querySelectorAll<HTMLElement>('.cols .txt')].map((e) => +getComputedStyle(e).opacity)
        const linksBottom = Math.max(...[...document.querySelectorAll<HTMLElement>('.cols .links')].map((e) => e.getBoundingClientRect().bottom))
        const imgTop = Math.min(...covering.map((p) => p.getBoundingClientRect().top))
        return {coveringCount: covering.length, txt, linksBottom, imgTop}
      })
      if (state.coveringCount > 0) {
        checked++
        expect(state.txt.every((o) => o === 1), `scroll ${y}: akapity muszą mieć opacity = 1`).toBe(true)
        expect(state.linksBottom, `scroll ${y}: dół linków nad górą obrazu`).toBeLessThanOrEqual(state.imgTop)
      }
    }
    expect(checked).toBeGreaterThan(0)
  })
}

test('fallback statyczny poniżej 900 px: bez klasy anim, akapity widoczne od razu', async ({page}) => {
  await page.setViewportSize({width: 600, height: 800})
  await page.goto('/pl/')
  await expect(page.locator('html')).not.toHaveClass(/anim/)
  for (const t of await page.locator('.cols .txt').all()) await expect(t).toHaveCSS('opacity', '1')
})

/** Adres artykułu z sitemap (testy nie zakładają konkretnych slugów). */
async function anyArticle(page: import('@playwright/test').Page) {
  const xml = await (await page.request.get('/sitemap.xml')).text()
  return [...xml.matchAll(/<loc>[^<]*?(\/pl\/[^/<]+\/[^/<]+\/)<\/loc>/g)].map((m) => m[1]).find((u) => !u.startsWith('/pl/atlas/'))!
}
const colsOpacity = (page: import('@playwright/test').Page) =>
  page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.cols .txt, .cols .links')].map((e) => +getComputedStyle(e).opacity))

for (const label of ['Home', 'Journal']) {
  test(`„${label}” z innej strony: kolumny hero w pełni widoczne, nie biała strona`, async ({page}) => {
    await page.setViewportSize({width: 1440, height: 860})
    await page.goto(await anyArticle(page))
    await page.locator('header nav a:visible', {hasText: new RegExp(`^${label}$`)}).first().click()
    await expect(page).toHaveURL(/\/pl\/#opowiesci$/)
    await expect(page.locator('html')).toHaveClass(/anim/)
    await expect.poll(() => colsOpacity(page)).toEqual(expect.arrayContaining([1]))
    expect((await colsOpacity(page)).every((o) => o === 1)).toBe(true)
    // po ustaleniu układu (fonty, load) pozycja się nie cofa
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(300)
    expect((await colsOpacity(page)).every((o) => o === 1)).toBe(true)
  })
}

test('„Home” na stronie głównej: animacja odgrywa się w drodze do końca, kolumny widoczne', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 860})
  await page.goto('/pl/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('html')).toHaveClass(/anim/)
  expect((await colsOpacity(page)).every((o) => o === 0)).toBe(true) // start animacji
  await page.locator('header nav a:visible', {hasText: /^Home$/}).first().click()
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(860)
  await expect.poll(async () => (await colsOpacity(page)).every((o) => o === 1)).toBe(true)
  await expect(page).toHaveURL(/#opowiesci$/)
})

test('nawigacja: tekst „Home” zamiast ikony oliwki', async ({page}) => {
  await page.goto('/pl/')
  await expect(page.locator('header nav a', {hasText: /^Home$/}).first()).toHaveAttribute('href', '/pl/#opowiesci')
  await expect(page.locator('header')).not.toContainText('🫒')
})
