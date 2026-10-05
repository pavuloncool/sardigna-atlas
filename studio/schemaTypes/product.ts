import {TagIcon} from '@sanity/icons/Tag'
import {defineField, defineType} from 'sanity'
import {affiliateFields, tagsField} from '../lib/fields'
import {slugFromLocalized} from '../lib/slugFromLocalized'

/** Produkt regionalny: jedzenie, napój albo przedmiot rękodzieła. */
export const product = defineType({
  name: 'product',
  title: 'Produkt',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({name: 'name', title: 'Nazwa', type: 'localizedString'}),
    defineField({
      name: 'slug',
      title: 'Slug',
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
          {title: 'Jedzenie', value: 'food'},
          {title: 'Napój / wino', value: 'drink'},
          {title: 'Rękodzieło', value: 'craft'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'protectedStatus',
      title: 'Oznaczenie jakości',
      type: 'string',
      options: {
        list: [
          {title: 'Brak', value: 'none'},
          {title: 'DOP', value: 'DOP'},
          {title: 'IGP', value: 'IGP'},
          {title: 'STG', value: 'STG'},
          {title: 'DOC', value: 'DOC'},
          {title: 'DOCG', value: 'DOCG'},
          {title: 'PAT (produkt tradycyjny)', value: 'PAT'},
        ],
      },
      initialValue: 'none',
    }),
    defineField({name: 'description', title: 'Opis', type: 'localizedText'}),
    defineField({name: 'image', title: 'Zdjęcie', type: 'mediaImage'}),
    defineField({
      name: 'origin',
      title: 'Pochodzenie',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'place'}]}],
    }),
    defineField({
      name: 'makers',
      title: 'Wytwórcy',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'person'}]}],
    }),
    ...affiliateFields,
    tagsField(),
  ],
  preview: {select: {title: 'name.pl', subtitle: 'kind', media: 'image'}},
})
