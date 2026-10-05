import {TagsIcon} from '@sanity/icons/Tags'
import {defineField, defineType} from 'sanity'
import {slugFromLocalized} from '../lib/slugFromLocalized'

/** Tag współdzielony przez wszystkie języki: nazwa wielojęzyczna, slug wspólny. */
export const tag = defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  icon: TagsIcon,
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
          {title: 'Temat', value: 'theme'},
          {title: 'Region', value: 'region'},
          {title: 'Epoka', value: 'era'},
        ],
      },
      initialValue: 'theme',
    }),
  ],
  orderings: [{title: 'Nazwa', name: 'name', by: [{field: 'name.pl', direction: 'asc'}]}],
  preview: {select: {title: 'name.pl', subtitle: 'kind'}},
})
