import {FolderIcon} from '@sanity/icons/Folder'
import {defineField, defineType} from 'sanity'

/** Sześć stałych działów. Klucz jest stabilny (nie zależy od języka), slugi są per język. */
export const category = defineType({
  name: 'category',
  title: 'Dział',
  type: 'document',
  icon: FolderIcon,
  fields: [
    defineField({
      name: 'key',
      title: 'Klucz',
      type: 'string',
      options: {
        list: [
          {title: 'Kulinaria & produkty', value: 'food'},
          {title: 'Rękodzieło', value: 'craft'},
          {title: 'Hotele', value: 'stay'},
          {title: 'Doświadczenia', value: 'experiences'},
          {title: 'Historia', value: 'history'},
          {title: 'Ludzie', value: 'people'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'name', title: 'Nazwa', type: 'localizedString'}),
    defineField({name: 'slugs', title: 'Slugi', type: 'localizedSlug'}),
    defineField({name: 'intro', title: 'Wstęp działu', type: 'localizedText'}),
    defineField({name: 'cover', title: 'Zdjęcie działu', type: 'mediaImage'}),
    defineField({name: 'order', title: 'Kolejność', type: 'number', initialValue: 10}),
  ],
  orderings: [{title: 'Kolejność', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'name.pl', subtitle: 'key', media: 'cover'}},
})
