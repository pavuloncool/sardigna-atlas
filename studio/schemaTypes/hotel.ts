import {HomeIcon} from '@sanity/icons/Home'
import {defineField, defineType} from 'sanity'
import {affiliateFields, tagsField} from '../lib/fields'

export const hotel = defineType({
  name: 'hotel',
  title: 'Hotel / nocleg',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({name: 'name', title: 'Nazwa', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Typ',
      type: 'string',
      options: {
        list: [
          {title: 'Hotel', value: 'hotel'},
          {title: 'Boutique hotel', value: 'boutique'},
          {title: 'Agriturismo', value: 'agriturismo'},
          {title: 'B&B', value: 'bnb'},
          {title: 'Willa / apartament', value: 'villa'},
        ],
      },
    }),
    defineField({
      name: 'place',
      title: 'Miejsce',
      type: 'reference',
      to: [{type: 'place'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'summary', title: 'Opis redakcyjny', type: 'localizedText'}),
    defineField({name: 'image', title: 'Zdjęcie główne', type: 'mediaImage'}),
    defineField({name: 'gallery', title: 'Galeria', type: 'array', of: [{type: 'mediaImage'}]}),
    defineField({
      name: 'priceRange',
      title: 'Przedział cenowy',
      type: 'string',
      options: {
        layout: 'radio',
        list: [
          {title: '€', value: '€'},
          {title: '€€', value: '€€'},
          {title: '€€€', value: '€€€'},
          {title: '€€€€', value: '€€€€'},
        ],
      },
    }),
    defineField({name: 'websiteUrl', title: 'Strona obiektu', type: 'url'}),
    defineField({name: 'bookingUrl', title: 'Link do rezerwacji', type: 'url'}),
    ...affiliateFields,
    defineField({name: 'coordinates', title: 'Współrzędne', type: 'geopoint'}),
    tagsField(),
  ],
  preview: {
    select: {title: 'name', type: 'type', place: 'place.name.pl', media: 'image'},
    prepare: ({title, type, place, media}) => ({
      title,
      subtitle: [type, place].filter(Boolean).join(' · '),
      media,
    }),
  },
})
