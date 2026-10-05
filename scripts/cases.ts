import * as Q from '../web/lib/sanity/queries.ts'

/** Wspólne przypadki dla verify-queries (seed w pamięci) i verify-live (dataset production). */
export const cases: [name: string, query: string, params: Record<string, unknown>][] = [
  ['articleBySlugQuery pl', Q.articleBySlugQuery, {lang: 'pl', slug: 'pane-carasau-chleb-z-potrzeby'}],
  ['articleBySlugQuery en', Q.articleBySlugQuery, {lang: 'en', slug: 'pane-carasau-bread-born-of-necessity'}],
  ['articleParamsQuery', Q.articleParamsQuery, {}],
  ['placeBySlugQuery', Q.placeBySlugQuery, {lang: 'pl', slug: 'barbagia', limit: 12}],
  ['placeParamsQuery', Q.placeParamsQuery, {}],
  ['entityHubQuery person', Q.entityHubQuery, {lang: 'pl', type: 'person', slug: 'osoba-a'}],
  ['entityHubQuery product', Q.entityHubQuery, {lang: 'en', type: 'product', slug: 'pane-carasau'}],
  ['exploreMapQuery', Q.exploreMapQuery, {lang: 'pl'}],
  ['homeQuery pl', Q.homeQuery, {lang: 'pl'}],
  ['homeQuery en', Q.homeQuery, {lang: 'en'}],
  ['categoryPageQuery', Q.categoryPageQuery, {lang: 'pl', slug: 'kulinaria', start: 0, end: 12}],
  ['sitemapQuery', Q.sitemapQuery, {}],
  ['relatedQuery', Q.relatedQuery, {lang: 'pl', id: 'seed-article-pane-pl', limit: 6}],
]
