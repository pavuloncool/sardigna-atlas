import groq from 'groq'

/**
 * Zapytania GROQ dla Sardigna Atlas.
 *
 * Parametry wspólne: $lang ('pl' | 'en' | 'it'), $slug.
 * Klient powinien używać perspective: 'published' i apiVersion z studio/lib/languages.ts.
 *
 * Zasady:
 *  - Article jest dokumentem per język (filtrujemy language == $lang).
 *  - Encje (Place, Person, Product, Hotel, Experience) są współdzielone; teksty wielojęzyczne
 *    czytamy z fallbackiem $lang → en → pl.
 *  - `^` w podzapytaniach oznacza element z zewnętrznego zakresu; w zagnieżdżonych filtrach
 *    trzeba użyć `^.^` (opisane przy `inPlaceTree`).
 */

// ─── Fragmenty ───────────────────────────────────────────────────────────────

/** Pole wielojęzyczne {pl,en,it} z fallbackiem $lang → en → pl. */
const t = (field: string) => `coalesce(${field}[$lang], ${field}.en, ${field}.pl)`

/** Zdjęcie + dane do blur placeholder (LQIP) i proporcji. */
const imageProjection = `{ ..., "lqip": asset->metadata.lqip, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height }`

const seoProjection = `seo{ title, description, noIndex, "ogImage": ogImage${imageProjection} }`

const placeMini = `{ "name": ${t('name')}, "slug": slug.current, kind }`

const categoryMini = `{ "key": key, "name": ${t('name')}, "slug": slugs[$lang] }`

/** Karta artykułu (listy, kafelki, „powiązane”). */
const articleCard = `{
  _id, title, "slug": slug.current, language, excerpt, format, publishedAt,
  "heroImage": heroImage${imageProjection},
  "category": category->${categoryMini},
  "place": location[0]->${placeMini}
}`

const placeRef = `{
  _id, "name": ${t('name')}, "slug": slug.current, kind,
  "parent": parent->{ "name": ${t('name')}, "slug": slug.current }
}`

const personRef = `{
  _id, name, "slug": slug.current, "role": ${t('role')},
  "portrait": portrait${imageProjection}
}`

const productRef = `{
  _id, "name": ${t('name')}, "slug": slug.current, kind, protectedStatus,
  affiliateUrl, isAffiliate, isSponsored,
  "brand": brand->{ name, "slug": slug.current },
  "image": image${imageProjection}
}`

const hotelRef = `{
  _id, name, "slug": slug.current, type, priceRange,
  websiteUrl, bookingUrl, affiliateUrl, isAffiliate, isSponsored,
  "image": image${imageProjection},
  "place": place->${placeMini}
}`

const experienceRef = `{
  _id, "title": ${t('title')}, "slug": slug.current, kind, durationMinutes, seasons, bookingUrl,
  affiliateUrl, isAffiliate, isSponsored,
  "image": image${imageProjection},
  "place": place->${placeMini}
}`

/**
 * Treść Portable Text z rozwiniętymi linkami do encji (entityLink) i danymi zdjęć.
 * Po stronie frontu: marks.entityLink → <Link href={hrefFor(target._type, target.slug)}>.
 */
const bodyProjection = `body[]{
  ...,
  _type == "block" => {
    markDefs[]{
      ...,
      _type == "entityLink" => {
        "target": target->{
          _type, "slug": slug.current,
          "label": coalesce(name[$lang], name.en, name.pl, name, title[$lang], title.en, title.pl)
        }
      }
    }
  },
  _type == "mediaImage" => {
    "lqip": asset->metadata.lqip,
    "width": asset->metadata.dimensions.width,
    "height": asset->metadata.dimensions.height
  }
}`

/** Wszystkie wersje językowe artykułu (do <link rel="alternate" hreflang> i przełącznika języka). */
const translationsProjection = `"translations": (
  *[_type == "translation.metadata" && references(^._id)][0].translations[].value->{ "slug": slug.current, language }
)[defined(slug)]`

/** To samo co `translationsProjection`, pod nazwą `alternates` (sitemap). Literał zamiast `.replace()`, bo typegen nie wykonuje wywołań. */
const alternatesProjection = `"alternates": (
  *[_type == "translation.metadata" && references(^._id)][0].translations[].value->{ "slug": slug.current, language }
)[defined(slug)]`

/**
 * Dokumenty typu `type`, które wskazują na miejsce z `^._id` LUB na jego potomka
 * (dzieci i wnuki: region → miasto → wieś). Używać wewnątrz projekcji dokumentu Place.
 *
 * Zakresy: w wewnętrznym `*[_type == "place" ...]` znak `^` to kandydat (np. artykuł),
 * a `^.^` to miejsce, dla którego budujemy stronę.
 */
const inPlaceTree = (type: string, extraFilter = '') => `*[_type == "${type}"${extraFilter} && (
  references(^._id) ||
  references(*[_type == "place" && (parent._ref == ^.^._id || parent->parent._ref == ^.^._id)]._id)
)]`

// ─── Artykuł ─────────────────────────────────────────────────────────────────

/** Strona artykułu: /[lang]/[category]/[slug] */
export const articleBySlugQuery = groq`*[_type == "article" && language == $lang && slug.current == $slug][0]{
  _id, title, "slug": slug.current, language, excerpt, format, publishedAt, _updatedAt,
  "heroImage": heroImage${imageProjection},
  "gallery": gallery[]${imageProjection},
  ${bodyProjection},
  "category": category->${categoryMini},
  "author": author->{
    name, "slug": slug.current, kind, website, "role": ${t('role')}, "bio": ${t('bio')},
    "disclosure": ${t('disclosure')}, "photo": photo${imageProjection}
  },
  "partnership": partnership{ type, note, "partners": partners[]->{ _type, name, "slug": slug.current } },
  "location": location[]->${placeRef},
  "people": people[]->${personRef},
  "products": products[]->${productRef},
  "experiences": experiences[]->${experienceRef},
  "hotel": hotel[]->${hotelRef},
  "related": related[]->${articleCard},
  "similar": *[
    _type == "article" && language == $lang && _id != ^._id &&
    references(
      coalesce(^.location[]._ref, []) + coalesce(^.people[]._ref, []) +
      coalesce(^.products[]._ref, []) + coalesce(^.experiences[]._ref, []) +
      coalesce(^.hotel[]._ref, [])
    )
  ] | order(publishedAt desc)[0...4] ${articleCard},
  ${seoProjection},
  ${translationsProjection}
}`

/** generateStaticParams dla artykułów: [{ slug, language }] */
export const articleParamsQuery = groq`*[_type == "article" && defined(slug.current) && defined(language)]{
  "slug": slug.current, language
}`

// ─── Miejsce ─────────────────────────────────────────────────────────────────

/**
 * Strona miejsca: /[lang]/places/[slug]. Region agreguje treści z całego drzewa potomków.
 * Parametr $limit ogranicza liczbę artykułów (paginację robi osobne zapytanie, jeśli trzeba).
 */
export const placeBySlugQuery = groq`*[_type == "place" && slug.current == $slug][0]{
  _id, "name": ${t('name')}, "slug": slug.current, kind, mapId, coordinates,
  "summary": ${t('summary')},
  "cover": cover${imageProjection},
  "ancestors": [
    parent->parent->{ "name": ${t('name')}, "slug": slug.current, kind },
    parent->{ "name": ${t('name')}, "slug": slug.current, kind }
  ][defined(slug)],
  "children": *[_type == "place" && parent._ref == ^._id] | order(name.pl asc){
    _id, "name": ${t('name')}, "slug": slug.current, kind,
    "cover": cover${imageProjection},
    "articleCount": count(${inPlaceTree('article', ' && language == $lang')})
  },
  "siblings": *[_type == "place" && defined(parent._ref) && parent._ref == ^.parent._ref && _id != ^._id][0...6]{
    _id, "name": ${t('name')}, "slug": slug.current, kind, "cover": cover${imageProjection}
  },
  "articles": ${inPlaceTree('article', ' && language == $lang')} | order(publishedAt desc)[0...$limit] ${articleCard},
  "people": ${inPlaceTree('person')} | order(name asc) ${personRef},
  "products": ${inPlaceTree('product')} | order(name.pl asc) ${productRef},
  "experiences": ${inPlaceTree('experience')} ${experienceRef},
  "hotels": ${inPlaceTree('hotel')} | order(name asc) ${hotelRef}
}`

/** generateStaticParams dla miejsc (slug wspólny dla wszystkich języków). */
export const placeParamsQuery = groq`*[_type == "place" && defined(slug.current)]{ "slug": slug.current }`

// ─── Osoba / produkt / doświadczenie / hotel (strona-hub) ────────────────────

/**
 * Generyczna strona encji: $type ∈ 'person' | 'product' | 'experience' | 'hotel'.
 * Zwraca podstawowe dane oraz wszystkie artykuły, które ją wskazują.
 */
export const entityHubQuery = groq`*[_type == $type && slug.current == $slug][0]{
  _type, _id, "slug": slug.current,
  "label": coalesce(name[$lang], name.en, name.pl, name, title[$lang], title.en, title.pl),
  "summary": coalesce(bio[$lang], description[$lang], summary[$lang], bio.en, description.en, summary.en, bio.pl, description.pl, summary.pl),
  "image": coalesce(portrait, image, logo)${imageProjection},
  kind, protectedStatus, websiteUrl, bookingUrl, affiliateUrl, isAffiliate, isSponsored,
  partnership, "brand": brand->{ name, "slug": slug.current },
  "brandProducts": select(_type == "brand" => *[_type == "product" && references(^._id)] | order(name.pl asc){
    _id, "name": ${t('name')}, "slug": slug.current, kind, affiliateUrl, isSponsored
  }),
  coordinates, priceRange, "sameAs": links[].url, "role": ${t('role')},
  "place": coalesce(place, origin[0], location[0])->${placeMini},
  "articles": *[_type == "article" && language == $lang && references(^._id)] | order(publishedAt desc) ${articleCard}
}`

// ─── Listy: strona główna, dział, mapa ───────────────────────────────────────

/** Regiony do mapy „Explore” (inline SVG): id ścieżki SVG = place.mapId. */
const regionsForMap = `*[_type == "place" && kind == "region" && defined(mapId)] | order(name.pl asc){
  _id, "name": ${t('name')}, "slug": slug.current, mapId,
  "articleCount": count(${inPlaceTree('article', ' && language == $lang')})
}`

export const exploreMapQuery = groq`${regionsForMap}`

/** Strona główna: wyróżniony artykuł, najnowsze, sekcje działów i regiony dla mapy. */
export const homeQuery = groq`{
  "featured": *[_type == "article" && language == $lang && featured == true] | order(publishedAt desc)[0] ${articleCard},
  "latest": *[_type == "article" && language == $lang] | order(publishedAt desc)[0...6] ${articleCard},
  "categories": *[_type == "category"] | order(order asc){
    _id, key, "name": ${t('name')}, "slug": slugs[$lang], "intro": ${t('intro')},
    "cover": cover${imageProjection},
    "articles": *[_type == "article" && language == $lang && references(^._id)] | order(publishedAt desc)[0...3] ${articleCard}
  },
  "regions": ${regionsForMap}
}`

/** Strona działu z paginacją: $start, $end (np. 0 i 12). */
export const categoryPageQuery = groq`{
  "category": *[_type == "category" && slugs[$lang] == $slug][0]{
    _id, key, "name": ${t('name')}, "slug": slugs[$lang], "intro": ${t('intro')},
    "cover": cover${imageProjection}, "alternates": slugs
  },
  "articles": *[
    _type == "article" && language == $lang &&
    category._ref == *[_type == "category" && slugs[$lang] == $slug][0]._id
  ] | order(publishedAt desc)[$start...$end] ${articleCard},
  "total": count(*[
    _type == "article" && language == $lang &&
    category._ref == *[_type == "category" && slugs[$lang] == $slug][0]._id
  ])
}`

// ─── SEO ─────────────────────────────────────────────────────────────────────

/** sitemap.xml + hreflang: artykuły z alternatywami językowymi oraz reszta encji. */
export const sitemapQuery = groq`{
  "articles": *[_type == "article" && defined(slug.current) && defined(language)]{
    "slug": slug.current, language, _updatedAt,
    ${alternatesProjection}
  },
  "categories": *[_type == "category"]{ slugs, _updatedAt },
  "places": *[_type == "place" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "people": *[_type == "person" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "products": *[_type == "product" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "experiences": *[_type == "experience" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "hotels": *[_type == "hotel" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "brands": *[_type == "brand" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "authors": *[_type == "author" && defined(slug.current)]{ "slug": slug.current, _updatedAt }
}`

// ─── Polecane / Powiązane (sekcja 5a briefu) ─────────────────────────────────

/**
 * Wszystkie „klucze powiązań” bieżącego dokumentu (`^` = dokument, dla którego liczymy blok):
 * jego tagi i referencje (dział, miejsce, nadrzędne miejsce, osoby, produkty, doświadczenia,
 * noclegi, pochodzenie, wytwórcy) oraz on sam (żeby encję łapały artykuły, które do niej prowadzą).
 * Uwaga: zapis przez `^` jest wymagany. Wersja z podzapytaniem `*[_id == $id][0]...` wewnątrz
 * `references()` zwraca pusto na żywym API, choć groq-js ją akceptuje (wykryte testem live).
 */
const refIds = (path: string) => `coalesce(^.${path}[]._ref, [])`
const relatedKeys = `array::compact(
  [^._id, ^.category._ref, ^.place._ref, ^.parent._ref, ^.brand._ref]
  + ${refIds('partnership.partners')} + ${refIds('tags')} + ${refIds('location')} + ${refIds('people')} + ${refIds('products')}
  + ${refIds('experiences')} + ${refIds('hotel')} + ${refIds('origin')} + ${refIds('makers')}
)`

/** Karta pozycji bloku „Powiązane”: artykuł albo encja (pole `image`, `title`, `date`). */
const relatedCard = `{
  _id, _type, "slug": slug.current, "date": coalesce(publishedAt, _createdAt),
  _type == "article" => {
    "title": title, language, excerpt, "image": heroImage${imageProjection},
    "category": category->${categoryMini}
  },
  _type == "place" => { "title": ${t('name')}, kind, "image": cover${imageProjection} },
  _type == "person" => { "title": name, "image": portrait${imageProjection} },
  _type == "product" => { "title": ${t('name')}, kind, "image": image${imageProjection} },
  _type == "hotel" => { "title": name, "image": image${imageProjection} },
  _type == "experience" => { "title": ${t('title')}, kind, "image": image${imageProjection} },
  _type == "brand" => { "title": name, "image": logo${imageProjection} }
}`

/**
 * Blok „Polecane / Powiązane” dla artykułu i encji (jedno zapytanie, liczone w buildzie).
 * Parametry: $id (opublikowany _id bieżącego dokumentu), $lang, $limit (domyślnie 6, podawać zawsze).
 *
 * - kandydaci: dokumenty dzielące z bieżącym ≥1 tag LUB ≥1 referencję (`references(relatedKeys)`),
 * - odfiltrowani: bieżący dokument oraz pozycje bez tłumaczenia w $lang,
 * - kolejność: najnowsze najpierw (publishedAt, a dla encji _createdAt),
 * - `pinnedRelated` (tylko artykuł) idzie na górę, reszta jest automatyczna,
 * - wynik `null` (brak dokumentu) lub `[]` = frontend nie renderuje bloku.
 */
export const relatedQuery = groq`*[_id == $id][0]{
  "items": (
    *[
      _type == "article" && language == $lang &&
      _id in coalesce(^.pinnedRelated[]._ref, [])
    ] | order(coalesce(publishedAt, _createdAt) desc) ${relatedCard}
    +
    *[
      _type in ["article", "place", "person", "product", "hotel", "experience", "brand"] &&
      _id != ^._id &&
      !(_id in coalesce(^.pinnedRelated[]._ref, [])) &&
      (_type != "article" || language == $lang) &&
      (_type in ["article", "person", "hotel", "brand"] || defined(coalesce(name[$lang], title[$lang]))) &&
      references(${relatedKeys})
    ] | order(coalesce(publishedAt, _createdAt) desc)[0...$limit] ${relatedCard}
  )[0...$limit]
}.items`

// ─── Strona (faza 3): nawigacja, trasy, Atlas, działy ────────────────────────

/** Działy ze wszystkimi wersjami językowymi nazw i slugów (fallback liczy front). */
export const categoriesQuery = groq`*[_type == "category"] | order(order asc){
  _id, key, name, slugs, intro, order, "cover": cover${imageProjection}
}`

/** Trasy artykułów (generateStaticParams): język + klucz działu + slug. */
export const articleRoutesQuery = groq`*[_type == "article" && defined(slug.current) && defined(language) && defined(category)]{
  "slug": slug.current, language, "categoryKey": category->key
}`

/** Trasy encji Atlasu (slug wspólny dla języków). */
export const entityRoutesQuery = groq`*[_type in ["place", "person", "product", "hotel", "experience", "brand"] && defined(slug.current)]{
  _type, "slug": slug.current
}`

/** Artykuły działu po kluczu działu (paginacja: $start, $end). */
export const categoryArticlesQuery = groq`{
  "articles": *[_type == "article" && language == $lang && category->key == $key]
    | order(publishedAt desc)[$start...$end] ${articleCard},
  "total": count(*[_type == "article" && language == $lang && category->key == $key])
}`

/** Strona Atlasu: wszystkie encje do list (nazwy z fallbackiem $lang → en → pl). */
export const atlasIndexQuery = groq`{
  "places": *[_type == "place"] | order(name.pl asc){ _id, "name": ${t('name')}, "slug": slug.current, kind, "parent": parent->{ "name": ${t('name')} } },
  "people": *[_type == "person"] | order(name asc){ _id, name, "slug": slug.current, "role": ${t('role')} },
  "products": *[_type == "product"] | order(name.pl asc){ _id, "name": ${t('name')}, "slug": slug.current, kind },
  "hotels": *[_type == "hotel"] | order(name asc){ _id, name, "slug": slug.current, type },
  "experiences": *[_type == "experience"] | order(title.pl asc){ _id, "title": ${t('title')}, "slug": slug.current, kind },
  "brands": *[_type == "brand"] | order(name asc){ _id, name, "slug": slug.current, kinds }
}`

// ─── Autorzy / twórcy (współpraca) ───────────────────────────────────────────

/** Profil autora (redakcja albo autor gościnny) z jego artykułami w języku strony. */
export const authorBySlugQuery = groq`*[_type == "author" && slug.current == $slug][0]{
  _id, name, "slug": slug.current, kind, website,
  "role": ${t('role')}, "bio": ${t('bio')}, "disclosure": ${t('disclosure')},
  "photo": photo${imageProjection},
  "links": links[]{ label, url },
  "articles": *[_type == "article" && language == $lang && references(^._id)] | order(publishedAt desc) ${articleCard}
}`

export const authorRoutesQuery = groq`*[_type == "author" && defined(slug.current)]{ "slug": slug.current }`

/** Lista autorów (wyróżnieni pierwsi) z liczbą artykułów w języku strony. */
export const authorsIndexQuery = groq`*[_type == "author" && defined(slug.current)] | order(coalesce(featured, false) desc, name asc){
  _id, name, "slug": slug.current, kind, "role": ${t('role')}, "photo": photo${imageProjection},
  "articleCount": count(*[_type == "article" && language == $lang && references(^._id)])
}`
