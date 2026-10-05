import {BasketIcon} from '@sanity/icons/Basket'
import {defineField, defineType} from 'sanity'
import {affiliateFields, tagsField} from '../lib/fields'

/**
 * Restauracja: w wersji 1.0 tylko dokument z linkiem afiliacyjnym (TheFork itp.);
 * brak własnej strony w routingu z sekcji 5 briefu.
 */
export const restaurant = defineType({
  name: 'restaurant',
  title: 'Restauracja',
  type: 'document',
  icon: BasketIcon,
  fields: [
    defineField({name: 'name', title: 'Nazwa', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'place', title: 'Miejsce', type: 'reference', to: [{type: 'place'}]}),
    defineField({name: 'summary', title: 'Opis redakcyjny', type: 'localizedText'}),
    defineField({name: 'image', title: 'Zdjęcie główne', type: 'mediaImage'}),
    defineField({name: 'websiteUrl', title: 'Strona restauracji', type: 'url'}),
    ...affiliateFields,
    defineField({name: 'coordinates', title: 'Współrzędne', type: 'geopoint'}),
    tagsField(),
  ],
  preview: {select: {title: 'name', subtitle: 'place.name.pl', media: 'image'}},
})
