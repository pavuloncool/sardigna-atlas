import {expect, test} from '@playwright/test'

/** Wyszukiwarka: pole w headerze rozwija się na cały ekran; wyniki z indeksu Pagefind (out/pagefind). */
test('pole w headerze rozwija się na cały ekran i szuka po Enter', async ({page}) => {
  await page.setViewportSize({width: 1210, height: 700})
  await page.goto('/pl/atlas/')
  const trigger = page.getByRole('button', {name: 'Otwórz wyszukiwarkę'})
  await expect(trigger).toBeVisible()

  await trigger.click()
  const dialog = page.getByRole('dialog', {name: 'Wyszukiwarka'})
  await expect(dialog).toBeVisible()
  // po animacji warstwa zajmuje cały ekran
  await expect.poll(async () => (await dialog.boundingBox())?.width).toBe(1210)
  await expect.poll(async () => (await dialog.boundingBox())?.height).toBe(700)
  await expect(page.getByRole('searchbox', {name: 'Szukaj'})).toBeFocused()

  await page.getByRole('searchbox', {name: 'Szukaj'}).fill('ceramika')
  await page.keyboard.press('Enter')
  await expect(dialog.locator('.so-results a').first()).toBeVisible()
  expect(await dialog.locator('.so-results a[href^="/en/"]').count()).toBe(0) // tylko język strony
})

test('lupa po prawej uruchamia wyszukiwanie, Esc zamyka i oddaje fokus', async ({page}) => {
  await page.setViewportSize({width: 1210, height: 700})
  await page.goto('/pl/atlas/')
  await page.getByRole('button', {name: 'Otwórz wyszukiwarkę'}).click()
  const dialog = page.getByRole('dialog', {name: 'Wyszukiwarka'})
  await page.getByRole('searchbox', {name: 'Szukaj'}).fill('tkanina')
  await dialog.getByRole('button', {name: 'Szukaj'}).click()
  await expect(dialog.locator('.so-results a').first()).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', {name: 'Otwórz wyszukiwarkę'})).toBeFocused()
})

test('przycisk × zamyka, a brak wyników daje komunikat', async ({page}) => {
  await page.goto('/pl/atlas/')
  await page.getByRole('button', {name: 'Otwórz wyszukiwarkę'}).click()
  const dialog = page.getByRole('dialog', {name: 'Wyszukiwarka'})
  await page.getByRole('searchbox', {name: 'Szukaj'}).fill('xqxqxq')
  await page.keyboard.press('Enter')
  await expect(dialog.getByText('Brak wyników')).toBeVisible()
  await dialog.getByRole('button', {name: 'Zamknij wyszukiwarkę'}).click()
  await expect(dialog).toBeHidden()
})

test('wersja EN ma angielskie etykiety i filtruje wyniki do EN', async ({page}) => {
  await page.goto('/en/atlas/')
  await page.getByRole('button', {name: 'Open search'}).click()
  await page.getByRole('searchbox', {name: 'Search'}).fill('textile')
  await page.keyboard.press('Enter')
  const links = page.getByRole('dialog', {name: 'Search'}).locator('.so-results a')
  await expect(links.first()).toBeVisible()
  expect(await page.locator('.so-results a[href^="/pl/"]').count()).toBe(0)
})

test('fragmenty wyników nie zawierają tekstu z bloków „Powiązane" ani z kart', async ({page}) => {
  await page.goto('/pl/atlas/')
  await page.getByRole('button', {name: 'Otwórz wyszukiwarkę'}).click()
  await page.getByRole('searchbox', {name: 'Szukaj'}).fill('ceramika')
  await page.keyboard.press('Enter')
  const results = page.locator('.so-results li')
  await expect(results.first()).toBeVisible()
  const texts = await results.allInnerTexts()
  expect(texts.length).toBeGreaterThan(0)
  for (const t of texts) {
    expect(t, 'etykiety bloków „Powiązane"/„Podobne" nie powinny trafiać do indeksu').not.toMatch(/Powiązane|Podobne/)
  }
})
