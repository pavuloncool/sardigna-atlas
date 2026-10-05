import type {SlugIsUniqueValidator} from 'sanity'
import {API_VERSION} from './languages'

/**
 * Slug musi być unikalny w obrębie typu ORAZ języka.
 * Dzięki temu PL i EN mogą mieć ten sam slug (np. nazwa własna "orgosolo").
 */
export const isUniqueInLanguage: SlugIsUniqueValidator = async (slug, context) => {
  const {document, getClient} = context
  const client = getClient({apiVersion: API_VERSION})
  const id = (document?._id ?? '').replace(/^drafts\./, '')
  const params = {
    draft: `drafts.${id}`,
    published: id,
    type: document?._type,
    slug,
    language: document?.language ?? null,
  }
  const query = `!defined(*[
    !(_id in [$draft, $published]) &&
    _type == $type &&
    slug.current == $slug &&
    language == $language
  ][0]._id)`
  return client.fetch(query, params)
}
