import {defineField, defineType} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({
      name: 'title',
      title: 'Tytuł SEO',
      type: 'string',
      description: 'Puste = tytuł artykułu.',
      validation: (Rule) => Rule.max(60).warning('Powyżej ~60 znaków Google może uciąć tytuł.'),
    }),
    defineField({
      name: 'description',
      title: 'Opis SEO',
      type: 'text',
      rows: 3,
      description: 'Puste = zajawka.',
      validation: (Rule) => Rule.max(160).warning('Powyżej ~160 znaków opis bywa ucinany.'),
    }),
    defineField({name: 'ogImage', title: 'Obraz Open Graph', type: 'image', options: {hotspot: true}}),
    defineField({name: 'noIndex', title: 'Nie indeksuj', type: 'boolean', initialValue: false}),
  ],
})
