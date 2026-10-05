import {expect, test, type Page} from '@playwright/test'

/**
 * Formularz kontaktowy w przeglądarce. `/api/contact` i skrypt Turnstile są podstawione,
 * więc test nie wysyła maili ani nie łączy się z Cloudflare.
 */
const fakeTurnstile = `window.turnstile={render:(el,o)=>{el.setAttribute('data-fake','1');setTimeout(()=>o.callback('TEST.TOKEN'),50);return 'w1'},reset:()=>{}}`

async function setup(page: Page, api: {status: number; body: unknown}) {
  const requests: {headers: Record<string, string>; body: string}[] = []
  const externalHits: string[] = []
  await page.route('**/challenges.cloudflare.com/**', (r) => {
    externalHits.push(r.request().url())
    return r.fulfill({contentType: 'application/javascript', body: fakeTurnstile})
  })
  await page.route('**/api/contact', async (r) => {
    requests.push({headers: r.request().headers(), body: r.request().postData() ?? ''})
    await r.fulfill({status: api.status, contentType: 'application/json', body: JSON.stringify(api.body)})
  })
  return {requests, externalHits}
}

const fill = async (page: Page) => {
  await page.getByLabel('Imię').fill('Anna')
  await page.getByLabel('Adres e-mail').fill('anna@example.com')
  await page.getByLabel('Wiadomość').fill('Dzień dobry, piszę w sprawie współpracy.')
}

test('Turnstile nie ładuje się przed interakcją z formularzem', async ({page}) => {
  const {externalHits} = await setup(page, {status: 200, body: {ok: true}})
  await page.goto('/pl/kontakt/')
  await expect(page.getByRole('form', {name: 'Formularz kontaktowy'})).toBeVisible()
  expect(externalHits).toHaveLength(0)
  await page.getByLabel('Imię').focus()
  await expect.poll(() => externalHits.length).toBeGreaterThan(0)
})

test('poprawna wysyłka: komunikat o sukcesie, token i język w żądaniu', async ({page}) => {
  const {requests} = await setup(page, {status: 200, body: {ok: true}})
  await page.goto('/pl/kontakt/')
  await fill(page)
  await expect(page.locator('.turnstile[data-fake]')).toHaveCount(1)
  await page.waitForTimeout(150)
  await page.getByRole('button', {name: 'Wyślij wiadomość'}).click()
  await expect(page.getByRole('status')).toContainText('wiadomość została wysłana')
  expect(requests).toHaveLength(1)
  expect(requests[0].body).toContain('TEST.TOKEN')
  expect(requests[0].body).toContain('anna@example.com')
  expect(requests[0].body).toContain('name="locale"')
})

test('limit dzienny: czytelny komunikat zamiast błędu', async ({page}) => {
  await setup(page, {status: 429, body: {ok: false, error: 'limit'}})
  await page.goto('/pl/kontakt/')
  await fill(page)
  await page.waitForTimeout(250)
  await page.getByRole('button', {name: 'Wyślij wiadomość'}).click()
  await expect(page.locator('.form-error')).toContainText('limit wiadomości został wyczerpany')
})

test('błędne dane: komunikat i podświetlone pola', async ({page}) => {
  await setup(page, {status: 422, body: {ok: false, error: 'invalid', fields: ['email']}})
  await page.goto('/pl/kontakt/')
  await fill(page)
  await page.waitForTimeout(250)
  await page.getByRole('button', {name: 'Wyślij wiadomość'}).click()
  await expect(page.locator('.form-error')).toContainText('Sprawdź zaznaczone pola')
  await expect(page.locator('.field-bad')).toHaveCount(1)
})

test('temat: lista opcji, domyślny i ustawiany z ?topic=, wysyłany w żądaniu', async ({page}) => {
  const {requests} = await setup(page, {status: 200, body: {ok: true}})
  await page.goto('/pl/kontakt/?topic=creator')
  const select = page.getByLabel('Temat')
  await expect(select.locator('option')).toHaveCount(5)
  await expect(select).toHaveValue('creator')
  await fill(page)
  await page.waitForTimeout(250)
  await page.getByRole('button', {name: 'Wyślij wiadomość'}).click()
  await expect(page.getByRole('status')).toContainText('wiadomość została wysłana')
  expect(requests[0].body).toContain('name="topic"')
  expect(requests[0].body).toContain('creator')
})

test('wersja EN ma angielskie etykiety', async ({page}) => {
  await setup(page, {status: 200, body: {ok: true}})
  await page.goto('/en/contact/')
  await expect(page.getByLabel('Email address')).toBeVisible()
  await expect(page.getByRole('button', {name: 'Send message'})).toBeVisible()
})
