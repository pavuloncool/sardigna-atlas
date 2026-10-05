import {StarIcon} from '@sanity/icons/Star'
import {defineField, defineType} from 'sanity'
import {affiliateFields, brandPartnershipTypes, tagsField} from '../lib/fields'

/**
 * Marka producenta żywności albo sprzętu kuchennego. Współpraca (afiliacja, sponsoring, barter)
 * jest opisana TUTAJ, a konkretny artykuł oznacza ją polem `partnership` (sekcja 12 briefu:
 * tylko zwykłe linki, bez widgetów i iframe'ów; Amazon wykluczony).
 */
export const brand = defineType({
  name: 'brand',
  title: 'Marka',
  type: 'document',
  icon: StarIcon,
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
      name: 'kinds',
      title: 'Rodzaj marki',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Producent żywności / napojów', value: 'food'},
          {title: 'Producent sprzętu kuchennego / AGD', value: 'equipment'},
        ],
      },
    }),
    defineField({name: 'logo', title: 'Logo / zdjęcie', type: 'mediaImage'}),
    defineField({name: 'description', title: 'Opis redakcyjny', type: 'localizedText'}),
    defineField({name: 'websiteUrl', title: 'Strona marki', type: 'url'}),
    defineField({
      name: 'partnership',
      title: 'Współpraca z marką',
      type: 'string',
      description: 'Relacja stała. Konkretny artykuł oznaczasz osobno w polu „Współpraca” artykułu.',
      options: {layout: 'radio', list: [...brandPartnershipTypes]},
      initialValue: 'none',
    }),
    ...affiliateFields,
    tagsField(),
  ],
  preview: {select: {title: 'name', subtitle: 'partnership', media: 'logo'}},
})
