import {UserIcon} from '@sanity/icons/User'
import {defineField, defineType} from 'sanity'

export const author = defineType({
  name: 'author',
  title: 'Autor',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({name: 'name', title: 'Imię i nazwisko', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'bio', title: 'Bio', type: 'localizedText'}),
    defineField({name: 'photo', title: 'Zdjęcie', type: 'mediaImage'}),
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
  ],
  preview: {select: {title: 'name', media: 'photo'}},
})
