/**
 * Dane seeda (faza 2). Wszystkie teksty redakcyjne to `[PLACEHOLDER]`; nazwy własne
 * (Barbagia, Nuoro, Orgosolo, Pane carasau) pochodzą z przykładów w schematach i prototypie.
 *
 * Seed używa czytelnych, stałych `_id` (prefiks `seed-`): relacje w NDJSON wymagają znanych
 * identyfikatorów, a `--replace` pozwala powtórzyć import bez duplikatów.
 */
export type Doc = Record<string, unknown> & {_id: string; _type: string}

/**
 * Pola obrazu dla klucza (spread do obiektu zdjęcia). NDJSON: `{_sanityAsset}` (import sam tworzy
 * `asset`), test w pamięci: gotowa referencja `asset`.
 */
export type AssetResolver = (key: string) => Record<string, unknown>

const ref = (id: string, weak = false) => ({_type: 'reference', _ref: id, ...(weak ? {_weak: true} : {})})
const refs = (...ids: string[]) => ids.map((id) => ({_key: id, ...ref(id)}))
const loc = (pl: string, en: string = pl) => ({pl, en})
const PH = '[PLACEHOLDER]'

export const IMAGE_KEYS = {
  terakota: ['#c8501f', '#d99a2b'],
  kobalt: ['#2b5c9e', '#4f9aa8'],
  granit: ['#8f8a7e', '#c9b08a'],
  mirt: ['#2f6b45', '#4f9aa8'],
  cannonau: ['#7a1f3d', '#c8501f'],
  morze: ['#4f9aa8', '#c9b08a'],
} as const satisfies Record<string, [string, string]>

export type ImageKey = keyof typeof IMAGE_KEYS

export function buildDocuments(asset: AssetResolver): Doc[] {
  const img = (key: ImageKey, alt: string) => ({_type: 'mediaImage', alt: `${PH} ${alt}`, ...asset(key)})

  const block = (key: string, text: string, style = 'normal', markDefs: unknown[] = [], marked: string[] = []) => ({
    _type: 'block',
    _key: key,
    style,
    markDefs,
    children: [{_type: 'span', _key: `${key}s`, text, marks: marked}],
  })
  const bodyFor = (lang: 'pl' | 'en', entityId: string) => {
    const t = lang === 'pl' ? 'Akapit z linkiem do miejsca' : 'Paragraph linking to a place'
    return [
      block('b1', `${PH} ${lang === 'pl' ? 'Nagłówek' : 'Heading'}`, 'h2'),
      {
        _type: 'block',
        _key: 'b2',
        style: 'normal',
        markDefs: [{_key: 'e1', _type: 'entityLink', target: ref(entityId)}],
        children: [
          {_type: 'span', _key: 'b2a', text: `${PH} ${t}: `, marks: []},
          {_type: 'span', _key: 'b2b', text: 'Orgosolo', marks: ['e1']},
          {_type: 'span', _key: 'b2c', text: '.', marks: []},
        ],
      },
      {_type: 'pullQuote', _key: 'b3', quote: `${PH} ${lang === 'pl' ? 'Cytat wyróżniony.' : 'Pull quote.'}`, attribution: PH},
      block('b4', `${PH} ${lang === 'pl' ? 'Kolejny akapit.' : 'Another paragraph.'}`),
    ]
  }

  const docs: Doc[] = []
  const add = (d: Doc) => docs.push(d)

  // ── Działy (sześć stałych) ────────────────────────────────────────────────
  const categories: [string, string, [string, string], [string, string], ImageKey][] = [
    ['food', 'Kulinaria & produkty', ['kulinaria', 'food'], ['Kulinaria & produkty', 'Food & products'], 'terakota'],
    ['craft', 'Rękodzieło', ['rekodzielo', 'craft'], ['Rękodzieło', 'Craft'], 'kobalt'],
    ['stay', 'Hotele', ['hotele', 'stays'], ['Hotele', 'Stays'], 'granit'],
    ['experiences', 'Doświadczenia', ['doswiadczenia', 'experiences'], ['Doświadczenia', 'Experiences'], 'mirt'],
    ['history', 'Historia', ['historia', 'history'], ['Historia', 'History'], 'cannonau'],
    ['people', 'Ludzie', ['ludzie', 'people'], ['Ludzie', 'People'], 'morze'],
  ]
  categories.forEach(([key, , slugs, names, cover], i) => {
    add({
      _id: `seed-category-${key}`,
      _type: 'category',
      key,
      name: loc(names[0], names[1]),
      slugs: loc(slugs[0], slugs[1]),
      intro: loc(`${PH} Wstęp działu.`, `${PH} Section intro.`),
      cover: img(cover, `Zdjęcie działu ${names[0]}`),
      order: (i + 1) * 10,
    })
  })

  // ── Tagi ──────────────────────────────────────────────────────────────────
  const tags: [string, string, string, string][] = [
    ['tradycja', 'Tradycja', 'Tradition', 'theme'],
    ['rzemioslo', 'Rzemiosło', 'Craftsmanship', 'theme'],
    ['barbagia', 'Barbagia', 'Barbagia', 'region'],
    ['wspolczesnosc', 'Współczesność', 'Contemporary', 'era'],
  ]
  tags.forEach(([slug, pl, en, kind]) =>
    add({_id: `seed-tag-${slug}`, _type: 'tag', name: loc(pl, en), slug: {_type: 'slug', current: slug}, kind}),
  )
  const tag = (...slugs: string[]) => refs(...slugs.map((s) => `seed-tag-${s}`))

  // ── Miejsca: region → miasto → wieś (+ wybrzeże) ──────────────────────────
  add({
    _id: 'seed-place-barbagia',
    _type: 'place',
    name: loc('Barbagia'),
    slug: {_type: 'slug', current: 'barbagia'},
    kind: 'region',
    mapId: 'barbagia',
    summary: loc(`${PH} Opis regionu.`, `${PH} Region description.`),
    cover: img('granit', 'Zdjęcie regionu Barbagia'),
    tags: tag('barbagia'),
  })
  add({
    _id: 'seed-place-nuoro',
    _type: 'place',
    name: loc('Nuoro'),
    slug: {_type: 'slug', current: 'nuoro'},
    kind: 'city',
    parent: ref('seed-place-barbagia'),
    summary: loc(`${PH} Opis miasta.`, `${PH} City description.`),
    cover: img('kobalt', 'Zdjęcie miasta Nuoro'),
  })
  add({
    _id: 'seed-place-orgosolo',
    _type: 'place',
    name: loc('Orgosolo'),
    slug: {_type: 'slug', current: 'orgosolo'},
    kind: 'village',
    parent: ref('seed-place-nuoro'),
    summary: loc(`${PH} Opis wsi.`, `${PH} Village description.`),
    cover: img('terakota', 'Zdjęcie wsi Orgosolo'),
    tags: tag('barbagia'),
  })
  add({
    _id: 'seed-place-golfo-di-orosei',
    _type: 'place',
    name: loc('Golfo di Orosei'),
    slug: {_type: 'slug', current: 'golfo-di-orosei'},
    kind: 'coast',
    summary: loc(`${PH} Opis wybrzeża.`, `${PH} Coast description.`),
    cover: img('morze', 'Zdjęcie wybrzeża'),
  })

  // ── Autor, osoby, produkty, nocleg, doświadczenie, restauracja ────────────
  add({
    _id: 'seed-author-redakcja',
    _type: 'author',
    name: `${PH} Redakcja`,
    slug: {_type: 'slug', current: 'redakcja'},
    bio: loc(`${PH} Bio autora.`, `${PH} Author bio.`),
  })
  add({
    _id: 'seed-person-a',
    _type: 'person',
    name: `${PH} Osoba A`,
    slug: {_type: 'slug', current: 'osoba-a'},
    role: loc(`${PH} tkaczka`, `${PH} weaver`),
    bio: loc(`${PH} Bio osoby.`, `${PH} Person bio.`),
    portrait: img('mirt', 'Portret osoby A'),
    location: refs('seed-place-orgosolo'),
    tags: tag('rzemioslo', 'tradycja'),
  })
  add({
    _id: 'seed-product-pane-carasau',
    _type: 'product',
    name: loc('Pane carasau'),
    slug: {_type: 'slug', current: 'pane-carasau'},
    kind: 'food',
    protectedStatus: 'none',
    description: loc(`${PH} Opis produktu.`, `${PH} Product description.`),
    image: img('terakota', 'Pane carasau'),
    origin: refs('seed-place-barbagia'),
    tags: tag('tradycja'),
  })
  add({
    _id: 'seed-product-tkanina',
    _type: 'product',
    name: loc(`${PH} Tkanina`, `${PH} Textile`),
    slug: {_type: 'slug', current: 'tkanina'},
    kind: 'craft',
    protectedStatus: 'none',
    description: loc(`${PH} Opis produktu.`, `${PH} Product description.`),
    image: img('kobalt', 'Tkanina'),
    origin: refs('seed-place-orgosolo'),
    makers: refs('seed-person-a'),
    tags: tag('rzemioslo'),
  })
  add({
    _id: 'seed-hotel-a',
    _type: 'hotel',
    name: `${PH} Hotel A`,
    slug: {_type: 'slug', current: 'hotel-a'},
    type: 'agriturismo',
    place: ref('seed-place-nuoro'),
    summary: loc(`${PH} Opis noclegu.`, `${PH} Stay description.`),
    image: img('granit', 'Nocleg'),
    priceRange: '€€',
    affiliateUrl: 'https://example.com/placeholder-hotel',
    affiliateNetwork: PH,
    isAffiliate: true,
    isSponsored: false,
    tags: tag('barbagia'),
  })
  add({
    _id: 'seed-experience-a',
    _type: 'experience',
    title: loc(`${PH} Warsztat`, `${PH} Workshop`),
    slug: {_type: 'slug', current: 'warsztat'},
    kind: 'workshop',
    place: ref('seed-place-orgosolo'),
    people: refs('seed-person-a'),
    products: refs('seed-product-tkanina'),
    description: loc(`${PH} Opis doświadczenia.`, `${PH} Experience description.`),
    image: img('cannonau', 'Warsztat'),
    durationMinutes: 120,
    seasons: ['year-round'],
    affiliateUrl: 'https://example.com/placeholder-experience',
    affiliateNetwork: PH,
    isAffiliate: true,
    isSponsored: false,
    tags: tag('rzemioslo'),
  })
  add({
    _id: 'seed-restaurant-a',
    _type: 'restaurant',
    name: `${PH} Restauracja A`,
    slug: {_type: 'slug', current: 'restauracja-a'},
    place: ref('seed-place-nuoro'),
    summary: loc(`${PH} Opis restauracji.`, `${PH} Restaurant description.`),
    image: img('morze', 'Restauracja'),
    affiliateUrl: 'https://example.com/placeholder-restaurant',
    affiliateNetwork: PH,
    isAffiliate: true,
    isSponsored: false,
  })

  // ── Artykuły: po 2 w PL i EN, wspólne tagi, relacje ───────────────────────
  type Spec = {
    key: string
    category: string
    publishedAt: string
    products: string[]
    people: string[]
    tags: string[]
    hero: ImageKey
    pl: {title: string; slug: string; excerpt: string}
    en: {title: string; slug: string; excerpt: string}
  }
  const specs: Spec[] = [
    {
      key: 'pane',
      category: 'food',
      publishedAt: '2026-09-10T08:00:00Z',
      products: ['seed-product-pane-carasau'],
      people: [],
      tags: ['tradycja', 'barbagia'],
      hero: 'terakota',
      pl: {title: 'Pane carasau: chleb, który powstał z potrzeby', slug: 'pane-carasau-chleb-z-potrzeby', excerpt: `${PH} Zajawka artykułu w dwóch zdaniach.`},
      en: {title: `${PH} Pane carasau: bread born of necessity`, slug: 'pane-carasau-bread-born-of-necessity', excerpt: `${PH} Article teaser in two sentences.`},
    },
    {
      key: 'tkactwo',
      category: 'craft',
      publishedAt: '2026-09-20T08:00:00Z',
      products: ['seed-product-tkanina'],
      people: ['seed-person-a'],
      tags: ['tradycja', 'barbagia', 'rzemioslo'],
      hero: 'kobalt',
      pl: {title: 'Kobiety sardyjskiego tkactwa', slug: 'kobiety-sardyjskiego-tkactwa', excerpt: `${PH} Zajawka artykułu w dwóch zdaniach.`},
      en: {title: `${PH} The women of Sardinian weaving`, slug: 'women-of-sardinian-weaving', excerpt: `${PH} Article teaser in two sentences.`},
    },
  ]
  for (const s of specs) {
    for (const lang of ['pl', 'en'] as const) {
      add({
        _id: `seed-article-${s.key}-${lang}`,
        _type: 'article',
        language: lang,
        title: s[lang].title,
        slug: {_type: 'slug', current: s[lang].slug},
        excerpt: s[lang].excerpt,
        format: 'story',
        featured: s.key === 'pane',
        body: bodyFor(lang, 'seed-place-orgosolo'),
        heroImage: img(s.hero, `Zdjęcie główne: ${s[lang].title}`),
        gallery: [{_key: 'g1', ...img('granit', 'Zdjęcie z galerii')}],
        category: ref(`seed-category-${s.category}`),
        location: refs('seed-place-orgosolo'),
        people: refs(...s.people),
        products: refs(...s.products),
        author: ref('seed-author-redakcja'),
        publishedAt: s.publishedAt,
        tags: tag(...s.tags),
        seo: {_type: 'seo'},
      })
    }
    // powiązanie wersji językowych (dokument tworzony normalnie przez wtyczkę tłumaczeń)
    add({
      _id: `seed-translation-${s.key}`,
      _type: 'translation.metadata',
      schemaTypes: ['article'],
      translations: (['pl', 'en'] as const).map((lang) => ({
        _key: lang,
        _type: 'internationalizedArrayReferenceValue',
        value: ref(`seed-article-${s.key}-${lang}`, true),
      })),
    })
  }

  return docs
}
