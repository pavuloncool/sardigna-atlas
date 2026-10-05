import {expect, test} from '@playwright/test'

/** Dane strukturalne i metadane społecznościowe w zbudowanych stronach (web/out). */
const ldTypes = async (page: import('@playwright/test').Page) => {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents()
  const nodes = raw.flatMap((t) => {
    const d = JSON.parse(t)
    return (Array.isArray(d) ? d : [d]).flatMap((x) => x['@graph'] ?? [x])
  })
  return nodes.map((n) => n['@type'] as string)
}

test('artykuł: Article + BreadcrumbList, OG 1200×630, hreflang', async ({page}) => {
  await page.goto('/pl/kulinaria/pane-carasau-chleb-z-potrzeby/')
  expect(await ldTypes(page)).toEqual(expect.arrayContaining(['Article', 'BreadcrumbList']))
  const og = await page.locator('meta[property="og:image"]').getAttribute('content')
  expect(og).toMatch(/w=1200&h=630/)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1)
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1)
})

test('encje: Person, Place, LodgingBusiness', async ({page}) => {
  await page.goto('/pl/atlas/ludzie/osoba-a/')
  expect(await ldTypes(page)).toContain('Person')
  await page.goto('/pl/atlas/miejsca/orgosolo/')
  expect(await ldTypes(page)).toContain('Place')
  await page.goto('/pl/atlas/noclegi/hotel-a/')
  expect(await ldTypes(page)).toContain('LodgingBusiness')
})

test('home: WebSite + Organization i domyślny obraz OG', async ({page}) => {
  await page.goto('/pl/')
  expect(await ldTypes(page)).toEqual(expect.arrayContaining(['WebSite', 'Organization']))
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toContain('/og/default.jpg')
  const res = await page.request.get('/og/default.jpg')
  expect(res.status()).toBe(200)
})
