import {defineField, defineType} from 'sanity'
import {DEFAULT_LANGUAGE, ENABLED_LANGUAGES} from '../../lib/languages'

/** Krótki tekst w wielu językach: { pl, en, (de) }. Domyślny język jest wymagany. */
export const localizedString = defineType({
  name: 'localizedString',
  title: 'Tekst krótki (wielojęzyczny)',
  type: 'object',
  fields: ENABLED_LANGUAGES.map((lang) =>
    defineField({
      name: lang.id,
      title: lang.title,
      type: 'string',
      validation: (Rule) => (lang.id === DEFAULT_LANGUAGE ? Rule.required() : Rule),
    }),
  ),
})

/** Dłuższy tekst (akapit) w wielu językach. */
export const localizedText = defineType({
  name: 'localizedText',
  title: 'Tekst długi (wielojęzyczny)',
  type: 'object',
  fields: ENABLED_LANGUAGES.map((lang) =>
    defineField({name: lang.id, title: lang.title, type: 'text', rows: 4}),
  ),
})

/** Slugi per język, np. działy: /pl/kulinaria vs /en/food. */
export const localizedSlug = defineType({
  name: 'localizedSlug',
  title: 'Slug (wielojęzyczny)',
  type: 'object',
  fields: ENABLED_LANGUAGES.map((lang) =>
    defineField({
      name: lang.id,
      title: lang.title,
      type: 'string',
      validation: (Rule) =>
        Rule.required()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {name: 'slug'})
          .error('Tylko małe litery a-z, cyfry i myślniki.'),
    }),
  ),
})
