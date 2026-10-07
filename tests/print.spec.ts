import {expect, test, type Page} from '@playwright/test'

/** Przycisk „Drukuj” pod artykułem i arkusz wydruku (web/out). */
async function firstArticle(page: Page, locale: 'pl' | 'en') {
  const xml = await (await page.request.get('/sitemap.xml')).text()
  const sections = locale === 'pl' ? 'kulinaria|rekodzielo|hotele|doswiadczenia|historia|ludzie' : '[a-z-]+'
  const re = new RegExp(`^/${locale}/(${sections})/(?!atlas/)[^/]+/$`)
  return [...xml.matchAll(/<loc>[^<]*?(\/(?:pl|en)\/[^<]*)<\/loc>/g)]
    .map((m) => m[1])
    .find((u) => re.test(u) && !/\/(strona|page)-\d+\/$/.test(u) && !/\/(autorzy|authors)\//.test(u))
}

for (const [locale, label] of [['pl', 'Drukuj'], ['en', 'Print']] as const) {
  test(`artykuł ${locale}: przycisk „${label}” otwiera okno druku`, async ({page}) => {
    const url = await firstArticle(page, locale)
    expect(url).toBeTruthy()
    await page.addInitScript(() => {
      ;(window as unknown as {printed: number}).printed = 0
      window.print = () => void (window as unknown as {printed: number}).printed++
    })
    await page.goto(url!)
    const btn = page.locator('article .print-btn')
    await expect(btn).toHaveText(label)
    await btn.click()
    await expect.poll(() => page.evaluate(() => (window as unknown as {printed: number}).printed)).toBe(1)
    // obrazy leniwe przełączone na eager i wczytane przed wydrukiem
    expect(await page.locator('main img[loading="lazy"]').count()).toBe(0)
  })
}

test('wydruk w ciemnym motywie: czarny tekst, tylko artykuł', async ({page}) => {
  const url = await firstArticle(page, 'pl')
  await page.emulateMedia({media: 'print', colorScheme: 'dark'})
  await page.goto(url!)
  const h1 = page.locator('article h1')
  await expect(h1).toBeVisible()
  expect(await h1.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(0, 0, 0)')
  await expect(page.locator('.site-header')).toBeHidden()
  await expect(page.locator('.site-footer')).toBeHidden()
  await expect(page.locator('.print-btn')).toBeHidden()
  await expect(page.locator('main > .sec').first()).toBeHidden()
  expect(await page.locator('article').evaluate((el) => getComputedStyle(el, '::after').content)).toMatch(/\/pl\/.+\//)
})
