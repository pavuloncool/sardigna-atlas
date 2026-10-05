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
