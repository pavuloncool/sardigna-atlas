import {describe, expect, it, vi} from 'vitest'
import {handleContact, validate, type Env, type Fetch} from '../web/functions/_lib/contact'

const env: Env = {
  RESEND_API_KEY: 're_test',
  CONTACT_TO_EMAIL: 'me@example.com',
  CONTACT_FROM_EMAIL: 'kontakt@mail.example.com',
  TURNSTILE_SECRET_KEY: 'secret',
  NEXT_PUBLIC_SITE_URL: 'https://mysardinia.online',
}

const good = {
  name: 'Anna',
  email: 'anna@example.com',
  message: 'Dzień dobry, piszę w sprawie współpracy.',
  'cf-turnstile-response': 'tok',
  locale: 'pl',
  website: '',
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://mysardinia.online/api/contact', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Origin: 'https://mysardinia.online', ...headers},
    body: JSON.stringify(body),
  })

/** Fałszywy fetch: Turnstile i Resend z konfigurowalnymi odpowiedziami. */
const fakeFetch = (turnstile: {success: boolean} | 'down', resend: {status: number; body?: unknown}) => {
  const fn = vi.fn(async (url: string, _init?: RequestInit) => {
    if (url.includes('turnstile')) {
      if (turnstile === 'down') throw new Error('network')
      return new Response(JSON.stringify(turnstile))
    }
    return new Response(JSON.stringify(resend.body ?? {id: 'x'}), {status: resend.status})
  })
  return fn as unknown as Fetch & typeof fn
}

const body = async (r: Response) => (await r.json()) as {ok: boolean; error?: string; fields?: string[]}

describe('handleContact', () => {
  it('wysyła mail i zwraca ok', async () => {
    const f = fakeFetch({success: true}, {status: 200})
    const res = await handleContact(post(good), env, f)
    expect(res.status).toBe(200)
    expect(await body(res)).toEqual({ok: true})
    const call = f.mock.calls.find(([u]) => u.includes('resend'))!
    const sent = JSON.parse(String(call[1]?.body))
    expect(sent.to).toEqual(['me@example.com'])
    expect(sent.reply_to).toBe('anna@example.com')
    expect(sent.from).toContain('kontakt@mail.example.com')
    expect(call[1]?.headers).toMatchObject({Authorization: 'Bearer re_test'})
  })

  it('odrzuca metody inne niż POST', async () => {
    const res = await handleContact(new Request('https://mysardinia.online/api/contact'), env, fakeFetch({success: true}, {status: 200}))
    expect(res.status).toBe(405)
  })

  it('odrzuca żądanie z cudzej domeny i bez Origin', async () => {
    const f = fakeFetch({success: true}, {status: 200})
    expect((await handleContact(post(good, {Origin: 'https://evil.example'}), env, f)).status).toBe(403)
    const noOrigin = new Request('https://mysardinia.online/api/contact', {method: 'POST', body: JSON.stringify(good), headers: {'Content-Type': 'application/json'}})
    expect((await handleContact(noOrigin, env, f)).status).toBe(403)
    expect(f).not.toHaveBeenCalled()
  })

  it('honeypot: udaje sukces, ale nic nie wysyła', async () => {
    const f = fakeFetch({success: true}, {status: 200})
    const res = await handleContact(post({...good, website: 'http://spam'}), env, f)
    expect(await body(res)).toEqual({ok: true})
    expect(f).not.toHaveBeenCalled()
  })

  it('waliduje pola i wskazuje błędne', async () => {
    const f = fakeFetch({success: true}, {status: 200})
    const res = await handleContact(post({...good, email: 'zly', message: 'krótko'}), env, f)
    expect(res.status).toBe(422)
    expect(await body(res)).toEqual({ok: false, error: 'invalid', fields: ['email', 'message']})
    expect(f).not.toHaveBeenCalled()
  })

  it('odrzuca nieudany Turnstile bez wysyłania maila', async () => {
    const f = fakeFetch({success: false}, {status: 200})
    const res = await handleContact(post(good), env, f)
    expect(res.status).toBe(400)
    expect((await body(res)).error).toBe('captcha')
    expect(f.mock.calls.some(([u]) => u.includes('resend'))).toBe(false)
  })

  it('brak tokenu Turnstile → captcha', async () => {
    const f = fakeFetch({success: true}, {status: 200})
    const res = await handleContact(post({...good, 'cf-turnstile-response': ''}), env, f)
    expect((await body(res)).error).toBe('captcha')
  })

  it('limit Resend (429) → czytelny błąd "limit", nie 500', async () => {
    const f = fakeFetch({success: true}, {status: 429, body: {name: 'daily_quota_exceeded'}})
    const res = await handleContact(post(good), env, f)
    expect(res.status).toBe(429)
    expect((await body(res)).error).toBe('limit')
  })

  it('awaria Turnstile lub Resend → unavailable (503)', async () => {
    expect((await handleContact(post(good), env, fakeFetch('down', {status: 200}))).status).toBe(503)
    const res = await handleContact(post(good), env, fakeFetch({success: true}, {status: 500}))
    expect(res.status).toBe(503)
    expect((await body(res)).error).toBe('unavailable')
  })

  it('brak konfiguracji → unavailable bez wywołań zewnętrznych', async () => {
    const f = fakeFetch({success: true}, {status: 200})
    const res = await handleContact(post(good), {...env, RESEND_API_KEY: undefined}, f)
    expect(res.status).toBe(503)
    expect(f).not.toHaveBeenCalled()
  })

  it('akceptuje formularz urlencoded', async () => {
    const f = fakeFetch({success: true}, {status: 200})
    const req = new Request('https://mysardinia.online/api/contact', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded', Origin: 'https://mysardinia.online'},
      body: new URLSearchParams(good).toString(),
    })
    expect((await handleContact(req, env, f)).status).toBe(200)
  })

  it('temat: domyślnie „pytanie”, poprawny trafia do tematu maila i treści', async () => {
    const f = fakeFetch({success: true}, {status: 200})
    await handleContact(post(good), env, f)
    const def = JSON.parse(String(f.mock.calls.find(([u]) => u.includes('resend'))![1]?.body))
    expect(def.subject).toContain('Pytanie lub uwaga')

    const f2 = fakeFetch({success: true}, {status: 200})
    await handleContact(post({...good, topic: 'creator'}), env, f2)
    const sent = JSON.parse(String(f2.mock.calls.find(([u]) => u.includes('resend'))![1]?.body))
    expect(sent.subject).toContain('Propozycja współpracy (twórca)')
    expect(sent.text).toContain('Temat / topic: Propozycja współpracy (twórca)')
  })

  it('temat spoza listy → invalid i brak wysyłki', async () => {
    const f = fakeFetch({success: true}, {status: 200})
    const res = await handleContact(post({...good, topic: 'hack'}), env, f)
    expect(res.status).toBe(422)
    expect((await body(res)).fields).toContain('topic')
    expect(f).not.toHaveBeenCalled()
  })

  it('za duże ciało → 413', async () => {
    const res = await handleContact(post(good, {'Content-Length': '999999'}), env, fakeFetch({success: true}, {status: 200}))
    expect(res.status).toBe(413)
  })

  it('nie pozwala wstrzyknąć nagłówków przez imię', async () => {
    const f = fakeFetch({success: true}, {status: 200})
    await handleContact(post({...good, name: 'Anna\r\nBcc: x@evil.com'}), env, f)
    const sent = JSON.parse(String(f.mock.calls.find(([u]) => u.includes('resend'))![1]?.body))
    expect(sent.subject).not.toMatch(/[\r\n]/)
  })
})

describe('validate', () => {
  it('przycina i normalizuje', () => {
    const r = validate({...good, name: '  Anna  ', locale: 'xx1'})
    expect(r.ok && r.value.name).toBe('Anna')
    expect(r.ok && r.value.locale).toBe('pl')
  })
})
