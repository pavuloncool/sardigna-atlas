import {UserIcon} from '@sanity/icons/User'
import {defineField, defineType} from 'sanity'
import {tagsField} from '../lib/fields'

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
    defineField({
      name: 'kind',
      title: 'Rodzaj autora',
      type: 'string',
      description:
        'Autor gościnny (np. twórca kulinarny) ma profil i podpis, ale nie loguje się do Studio: treści wprowadza redakcja.',
      options: {
        layout: 'radio',
        list: [
          {title: 'Redakcja', value: 'staff'},
          {title: 'Autor gościnny / twórca', value: 'guest'},
        ],
      },
      initialValue: 'staff',
    }),
    defineField({name: 'role', title: 'Kim jest', type: 'localizedString', description: 'np. twórca kulinarny, fotograf'}),
    defineField({name: 'bio', title: 'Bio', type: 'localizedText'}),
    defineField({name: 'photo', title: 'Zdjęcie', type: 'mediaImage'}),
    defineField({name: 'website', title: 'Strona autora', type: 'url'}),
    defineField({
      name: 'disclosure',
      title: 'Informacja o współpracach autora',
      type: 'localizedText',
      description: 'Opcjonalnie: z jakimi markami autor współpracuje. Pokazywana pod tekstem i na profilu.',
    }),
    defineField({name: 'featured', title: 'Wyróżniony na liście autorów', type: 'boolean', initialValue: false}),
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
  preview: {select: {title: 'name', subtitle: 'kind', media: 'photo'}},
})
