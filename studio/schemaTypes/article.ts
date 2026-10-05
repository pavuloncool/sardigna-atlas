import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {isUniqueInLanguage} from '../lib/isUniqueInLanguage'
import {bodyMembers} from './objects/body'

const refs = (type: string) => [defineArrayMember({type: 'reference', to: [{type}]})]

/**
 * Artykuł jest dokumentem PER JĘZYK (pole `language` ustawia wtyczka
 * @sanity/document-internationalization). Powiązane wersje językowe trzyma
 * dokument `translation.metadata`, więc nie ma tu pola `translations`.
 * Relacje (location, people, products, ...) wskazują encje współdzielone,
 * więc każdy język łączy się z tymi samymi miejscami i ludźmi.
 */
export const article = defineType({
  name: 'article',
  title: 'Artykuł',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    {name: 'content', title: 'Treść', default: true},
    {name: 'relations', title: 'Powiązania'},
    {name: 'media', title: 'Media'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'language', type: 'string', readOnly: true, hidden: true}),
    defineField({
      name: 'title',
      title: 'Tytuł',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().max(110),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title', maxLength: 96, isUnique: isUniqueInLanguage},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Zajawka',
      type: 'text',
      rows: 3,
      group: 'content',
      validation: (Rule) => Rule.required().max(220),
    }),
    defineField({
      name: 'format',
      title: 'Format',
      type: 'string',
      group: 'content',
      options: {
        layout: 'radio',
        list: [
          {title: 'Reportaż / opowieść', value: 'story'},
          {title: 'Portret osoby', value: 'profile'},
          {title: 'Przewodnik', value: 'guide'},
          {title: 'Przepis', value: 'recipe'},
        ],
      },
      initialValue: 'story',
    }),
    defineField({name: 'body', title: 'Treść', type: 'array', group: 'content', of: bodyMembers}),
    defineField({
      name: 'featured',
      title: 'Wyróżniony na stronie głównej',
      type: 'boolean',
      group: 'content',
      initialValue: false,
    }),

    defineField({name: 'heroImage', title: 'Zdjęcie główne', type: 'mediaImage', group: 'media', validation: (Rule) => Rule.required()}),
    defineField({name: 'gallery', title: 'Galeria', type: 'array', group: 'media', of: [defineArrayMember({type: 'mediaImage'})]}),

    defineField({
      name: 'category',
      title: 'Dział',
      type: 'reference',
      to: [{type: 'category'}],
      group: 'relations',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'location', title: 'Miejsca', type: 'array', group: 'relations', of: refs('place')}),
    defineField({name: 'people', title: 'Ludzie', type: 'array', group: 'relations', of: refs('person')}),
    defineField({name: 'products', title: 'Produkty', type: 'array', group: 'relations', of: refs('product')}),
    defineField({name: 'experiences', title: 'Doświadczenia', type: 'array', group: 'relations', of: refs('experience')}),
    defineField({name: 'hotel', title: 'Hotele', type: 'array', group: 'relations', of: refs('hotel')}),
    defineField({
      name: 'related',
      title: 'Powiązane artykuły (ręcznie)',
      type: 'array',
      group: 'relations',
      description: 'Tylko artykuły w tym samym języku. Reszta powiązań liczy się automatycznie z miejsc, ludzi i produktów.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'article'}],
          options: {
            filter: ({document}) => ({
              filter: 'language == $language && _id != $id',
              params: {
                language: document.language ?? null,
                id: String(document._id ?? '').replace(/^drafts\./, ''),
              },
            }),
          },
        }),
      ],
    }),
    defineField({name: 'author', title: 'Autor', type: 'reference', to: [{type: 'author'}], group: 'relations'}),
    defineField({
      name: 'publishedAt',
      title: 'Data publikacji',
      type: 'datetime',
      group: 'relations',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),

    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  orderings: [
    {title: 'Data publikacji (najnowsze)', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', lang: 'language', cat: 'category.name.pl', media: 'heroImage'},
    prepare: ({title, lang, cat, media}) => ({
      title,
      subtitle: [lang && String(lang).toUpperCase(), cat].filter(Boolean).join(' · '),
      media,
    }),
  },
})
