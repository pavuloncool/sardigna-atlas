import {UserIcon} from '@sanity/icons/User'
import {defineField, defineType} from 'sanity'
import {tagsField} from '../lib/fields'

export const person = defineType({
  name: 'person',
  title: 'Osoba',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Imię i nazwisko',
      type: 'string',
      description: 'Nie tłumaczymy nazw własnych.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'role', title: 'Kim jest', type: 'localizedString', description: 'np. tkaczka, piekarz, pasterz'}),
    defineField({name: 'bio', title: 'Bio', type: 'localizedText'}),
    defineField({name: 'portrait', title: 'Portret', type: 'mediaImage'}),
    defineField({
      name: 'location',
      title: 'Gdzie mieszka / pracuje',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'place'}]}],
    }),
    defineField({
      name: 'links',
      title: 'Linki',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'label', title: 'Etykieta', type: 'string'},
            {name: 'url', title: 'URL', type: 'url'},
          ],
          preview: {select: {title: 'label', subtitle: 'url'}},
        },
      ],
    }),
    tagsField(),
  ],
  preview: {select: {title: 'name', subtitle: 'role.pl', media: 'portrait'}},
})
