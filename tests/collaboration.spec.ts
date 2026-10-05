import {expect, test} from '@playwright/test'

/**
 * Współpraca: autorzy gościnni, oznaczenia, marki, sprzęt (dane testowe z seeda w produkcyjnym datasecie).
 */
const ldTypes = async (page: import('@playwright/test').Page) => {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents()
  return raw.flatMap((t) => {
    const d = JSON.parse(t)
    return (Array.isArray(d) ? d : [d]).flatMap((x) => x['@graph'] ?? [x]).map((n: {'@type': string}) => n['@type'])
  })
}

test('lista autorów i profil twórcy gościnnego', async ({page}) => {
  await page.goto('/pl/autorzy/')
  await expect(page.getByRole('heading', {level: 1, name: 'Autorzy'})).toBeVisible()
  const link = page.locator('.tiles a[href="/pl/autorzy/tworca-a/"]')
  await expect(link).toBeVisible()

  await page.goto('/pl/autorzy/tworca-a/')
  await expect(page.getByRole('heading', {level: 1})).toContainText('Twórca A')
  await expect(page.locator('.meta').first()).toContainText('Autor gościnny')
  await expect(page.locator('.affiliate-note')).toContainText('Współprace autora')
  await expect(page.locator('.feed a[href*="/pl/kulinaria/pane-carasau"]').first()).toBeVisible()
  expect(await ldTypes(page)).toEqual(expect.arrayContaining(['Person', 'BreadcrumbList']))
})

test('artykuł z współpracą: oznaczenie na początku, partnerzy jako linki, autor i sprzęt', async ({page}) => {
  await page.goto('/pl/kulinaria/pane-carasau-chleb-z-potrzeby/')
  const note = page.locator('.art-note .affiliate-note')
  await expect(note).toContainText('Współpraca reklamowa')
  await expect(note.locator('a[href="/pl/atlas/marki/marka-a/"]')).toBeVisible()
  await expect(note.locator('a[href="/pl/autorzy/tworca-a/"]')).toBeVisible()
  await expect(note).toContainText('linki afiliacyjne') // sprzęt z affiliateUrl dokłada informację o afiliacji
  // oznaczenie jest przed zdjęciem głównym
  const noteY = (await note.boundingBox())!.y
  const heroY = (await page.locator('.art-hero').boundingBox())!.y
  expect(noteY).toBeLessThan(heroY)
  // podpis z linkiem do profilu i blok „O autorze”
  await expect(page.locator('.meta a[href="/pl/autorzy/tworca-a/"]')).toBeVisible()
  await expect(page.getByRole('heading', {name: 'O autorze'})).toBeVisible()
  // sprzęt w osobnej sekcji, link afiliacyjny z rel sponsored
  const equipment = page.getByRole('region', {name: 'Sprzęt'})
  await expect(equipment).toBeVisible()
  await expect(equipment.locator('a.aff')).toHaveAttribute('rel', 'sponsored noopener')
})

test('artykuł EN: angielskie oznaczenie współpracy', async ({page}) => {
  await page.goto('/en/food/pane-carasau-bread-born-of-necessity/')
  await expect(page.locator('.art-note .affiliate-note')).toContainText('Paid collaboration')
  await expect(page.getByRole('heading', {name: 'About the author'})).toBeVisible()
})

test('artykuł bez współpracy i bez afiliacji nie ma oznaczenia', async ({page}) => {
  await page.goto('/pl/rekodzielo/kobiety-sardyjskiego-tkactwa/')
  await expect(page.locator('.art-note')).toHaveCount(0)
})

test('marka: strona z logo, afiliacją i produktami; produkt wskazuje markę', async ({page}) => {
  await page.goto('/pl/atlas/marki/marka-a/')
  await expect(page.getByRole('heading', {level: 1})).toContainText('Marka A')
  await expect(page.locator('.meta').first()).toContainText('Partner afiliacyjny')
  await expect(page.locator('a.aff').first()).toHaveAttribute('rel', 'sponsored noopener')
  await expect(page.locator('.tiles a[href*="/pl/atlas/produkty/sprzet-kuchenny/"]').first()).toBeVisible()
  expect(await ldTypes(page)).toEqual(expect.arrayContaining(['Organization', 'BreadcrumbList']))

  await page.goto('/pl/atlas/produkty/sprzet-kuchenny/')
  await expect(page.locator('.meta a[href="/pl/atlas/marki/marka-a/"]')).toBeVisible()
})

test('strona Współpraca: linki do formularza z tematem, link w stopce', async ({page}) => {
  await page.goto('/pl/wspolpraca/')
  await expect(page.getByRole('heading', {level: 1, name: 'Współpraca'})).toBeVisible()
  await expect(page.locator('a[href="/pl/kontakt/?topic=creator"]')).toBeVisible()
  await expect(page.locator('a[href="/pl/kontakt/?topic=brand"]')).toBeVisible()
  await expect(page.locator('footer a[href="/pl/wspolpraca/"]')).toBeVisible()
  await expect(page.locator('footer a[href="/pl/autorzy/"]')).toBeVisible()
  await page.goto('/en/collaborate/')
  await expect(page.getByRole('heading', {level: 1, name: 'Collaborate'})).toBeVisible()
})
