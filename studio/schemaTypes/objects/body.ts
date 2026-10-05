import {defineArrayMember, defineField, defineType} from 'sanity'

export const pullQuote = defineType({
  name: 'pullQuote',
  title: 'Cytat wyróżniony',
  type: 'object',
  fields: [
    defineField({name: 'quote', title: 'Cytat', type: 'text', rows: 3, validation: (Rule) => Rule.required()}),
    defineField({name: 'attribution', title: 'Kto mówi', type: 'string'}),
  ],
  preview: {select: {title: 'quote', subtitle: 'attribution'}},
})

/**
 * Treść artykułu (Portable Text).
 * `entityLink` to inline'owy link do Place/Person/Product/Hotel/Experience:
 * to on daje automatyczne hiper-łączenie z poziomu samego tekstu.
 */
export const bodyMembers = [
  defineArrayMember({
    type: 'block',
    styles: [
      {title: 'Akapit', value: 'normal'},
      {title: 'Nagłówek 2', value: 'h2'},
      {title: 'Nagłówek 3', value: 'h3'},
      {title: 'Cytat', value: 'blockquote'},
    ],
    lists: [
      {title: 'Punktowana', value: 'bullet'},
      {title: 'Numerowana', value: 'number'},
    ],
    marks: {
      decorators: [
        {title: 'Pogrubienie', value: 'strong'},
        {title: 'Kursywa', value: 'em'},
      ],
      annotations: [
        {
          name: 'link',
          title: 'Link zewnętrzny',
          type: 'object',
          fields: [
            {
              name: 'href',
              title: 'URL',
              type: 'url',
              validation: (Rule) => Rule.uri({scheme: ['http', 'https', 'mailto', 'tel']}),
            },
          ],
        },
        {
          name: 'entityLink',
          title: 'Link do miejsca / osoby / produktu',
          type: 'object',
          fields: [
            {
              name: 'target',
              title: 'Cel',
              type: 'reference',
              to: [
                {type: 'place'},
                {type: 'person'},
                {type: 'product'},
                {type: 'hotel'},
                {type: 'experience'},
              ],
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
    },
  }),
  defineArrayMember({type: 'mediaImage'}),
  defineArrayMember({type: 'pullQuote'}),
]
