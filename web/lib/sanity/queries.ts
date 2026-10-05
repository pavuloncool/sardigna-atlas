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
  "author": author->{ name, "slug": slug.current, "bio": ${t('bio')}, "photo": photo${imageProjection} },
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
  "image": coalesce(portrait, image)${imageProjection},
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
  "hotels": *[_type == "hotel" && defined(slug.current)]{ "slug": slug.current, _updatedAt }
}`

// ─── Polecane / Powiązane (sekcja 5a briefu) ─────────────────────────────────

/** Bieżący dokument; `$id` to _id opublikowanego dokumentu (bez prefiksu `drafts.`). */
const current = `*[_id == $id][0]`
const refIds = (path: string) => `coalesce(${current}.${path}[]._ref, [])`

/**
 * Wszystkie „klucze powiązań” bieżącego dokumentu: jego tagi i referencje (dział, miejsce,
 * nadrzędne miejsce, osoby, produkty, doświadczenia, noclegi, pochodzenie, wytwórcy)
 * oraz on sam (żeby encję łapały artykuły, które do niej prowadzą).
 */
const relatedKeys = `array::compact(
  [$id, ${current}.category._ref, ${current}.place._ref, ${current}.parent._ref]
  + ${refIds('tags')} + ${refIds('location')} + ${refIds('people')} + ${refIds('products')}
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
  _type == "experience" => { "title": ${t('title')}, kind, "image": image${imageProjection} }
}`

/**
 * Blok „Polecane / Powiązane” dla artykułu i encji (jedno zapytanie, liczone w buildzie).
 * Parametry: $id (opublikowany _id bieżącego dokumentu), $lang, $limit (domyślnie 6, podawać zawsze).
 *
 * - kandydaci: dokumenty dzielące z bieżącym ≥1 tag LUB ≥1 referencję (`references(relatedKeys)`),
 * - odfiltrowani: bieżący dokument oraz pozycje bez tłumaczenia w $lang,
 * - kolejność: najnowsze najpierw (publishedAt, a dla encji _createdAt),
 * - `pinnedRelated` (tylko artykuł) idzie na górę, reszta jest automatyczna,
 * - pusty wynik = frontend nie renderuje bloku.
 */
export const relatedQuery = groq`(
  *[
    _type == "article" && language == $lang &&
    _id in coalesce(${current}.pinnedRelated[]._ref, [])
  ] | order(coalesce(publishedAt, _createdAt) desc) ${relatedCard}
  +
  *[
    _type in ["article", "place", "person", "product", "hotel", "experience"] &&
    _id != $id &&
    !(_id in coalesce(${current}.pinnedRelated[]._ref, [])) &&
    (_type != "article" || language == $lang) &&
    (_type in ["article", "person", "hotel"] || defined(coalesce(name[$lang], title[$lang]))) &&
    references(${relatedKeys})
  ] | order(coalesce(publishedAt, _createdAt) desc)[0...$limit] ${relatedCard}
)[0...$limit]`
