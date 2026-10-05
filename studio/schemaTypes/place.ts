import {PinIcon} from '@sanity/icons/Pin'
import {defineField, defineType} from 'sanity'
import {slugFromLocalized} from '../lib/slugFromLocalized'

/**
 * Miejsce to węzeł hierarchii: region → miasto → wieś/wybrzeże/atrakcja.
 * Strona regionu agreguje treści ze wszystkich potomków (zapytania GROQ obsługują do 3 poziomów).
 */
export const place = defineType({
  name: 'place',
  title: 'Miejsce',
  type: 'document',
  icon: PinIcon,
  fields: [
    defineField({name: 'name', title: 'Nazwa', type: 'localizedString'}),
    defineField({
      name: 'slug',
      title: 'Slug (wspólny dla wszystkich języków)',
      type: 'slug',
      options: {source: slugFromLocalized('name'), maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Rodzaj',
      type: 'string',
      options: {
        layout: 'radio',
        list: [
          {title: 'Region (np. Barbagia)', value: 'region'},
          {title: 'Miasto (np. Nuoro)', value: 'city'},
          {title: 'Wieś / miasteczko (np. Orgosolo)', value: 'village'},
          {title: 'Wybrzeże / plaża', value: 'coast'},
          {title: 'Atrakcja / obiekt', value: 'landmark'},
        ],
      },
      initialValue: 'village',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'parent',
      title: 'Nadrzędne miejsce',
      type: 'reference',
      to: [{type: 'place'}],
      description: 'np. Orgosolo → Barbagia. Maksymalnie 3 poziomy.',
      validation: (Rule) =>
        Rule.custom((parent, context) => {
          const id = (context.document?._id ?? '').replace(/^drafts\./, '')
          const ref = (parent as {_ref?: string} | undefined)?._ref
          return ref && ref === id ? 'Miejsce nie może być własnym rodzicem.' : true
        }),
    }),
    defineField({
      name: 'mapId',
      title: 'ID regionu na mapie SVG',
      type: 'string',
      description: 'Musi odpowiadać atrybutowi id ścieżki w mapie Sardynii.',
      hidden: ({document}) => document?.kind !== 'region',
    }),
    defineField({name: 'summary', title: 'Opis', type: 'localizedText'}),
    defineField({name: 'cover', title: 'Zdjęcie', type: 'mediaImage'}),
    defineField({name: 'coordinates', title: 'Współrzędne', type: 'geopoint'}),
  ],
  preview: {
    select: {title: 'name.pl', kind: 'kind', parent: 'parent.name.pl', media: 'cover'},
    prepare: ({title, kind, parent, media}) => ({
      title,
      subtitle: [kind, parent && `→ ${parent}`].filter(Boolean).join(' '),
      media,
    }),
  },
})
