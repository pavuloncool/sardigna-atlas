import {SparklesIcon} from '@sanity/icons/Sparkles'
import {defineField, defineType} from 'sanity'
import {affiliateFields, tagsField} from '../lib/fields'
import {slugFromLocalized} from '../lib/slugFromLocalized'

export const experience = defineType({
  name: 'experience',
  title: 'Doświadczenie',
  type: 'document',
  icon: SparklesIcon,
  fields: [
    defineField({name: 'title', title: 'Nazwa', type: 'localizedString'}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: slugFromLocalized('title'), maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Rodzaj',
      type: 'string',
      options: {
        list: [
          {title: 'Degustacja', value: 'tasting'},
          {title: 'Warsztat', value: 'workshop'},
          {title: 'Trekking / natura', value: 'outdoor'},
          {title: 'Rejs / woda', value: 'sea'},
          {title: 'Święto / festiwal', value: 'festival'},
          {title: 'Kultura / zwiedzanie', value: 'culture'},
        ],
      },
    }),
    defineField({name: 'place', title: 'Miejsce', type: 'reference', to: [{type: 'place'}]}),
    defineField({
      name: 'people',
      title: 'Osoby (gospodarze, przewodnicy)',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'person'}]}],
    }),
    defineField({
      name: 'products',
      title: 'Powiązane produkty',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'product'}]}],
    }),
    defineField({name: 'description', title: 'Opis', type: 'localizedText'}),
    defineField({name: 'image', title: 'Zdjęcie', type: 'mediaImage'}),
    defineField({name: 'durationMinutes', title: 'Czas trwania (min)', type: 'number', validation: (Rule) => Rule.positive().integer()}),
    defineField({
      name: 'seasons',
      title: 'Sezon',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Wiosna', value: 'spring'},
          {title: 'Lato', value: 'summer'},
          {title: 'Jesień', value: 'autumn'},
          {title: 'Zima', value: 'winter'},
          {title: 'Cały rok', value: 'year-round'},
        ],
      },
    }),
    defineField({name: 'priceNote', title: 'Informacja o cenie', type: 'localizedString'}),
    defineField({name: 'bookingUrl', title: 'Link do rezerwacji / kontaktu', type: 'url'}),
    ...affiliateFields,
    tagsField(),
  ],
  preview: {select: {title: 'title.pl', subtitle: 'kind', media: 'image'}},
})
