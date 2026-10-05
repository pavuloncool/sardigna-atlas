import {defineField, defineType} from 'sanity'

/**
 * Zdjęcie z metadanymi redakcyjnymi. Hotspot pozwala kadrować 3:2 / 4:5 / 16:9
 * z jednego pliku (kadr wybiera redaktor, nie CSS).
 * Uwaga: `alt` jest w języku dokumentu (Article) lub w języku domyślnym (encje).
 */
export const mediaImage = defineType({
  name: 'mediaImage',
  title: 'Zdjęcie',
  type: 'image',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: 'Tekst alternatywny',
      type: 'string',
      description: 'Opisz, co widać. Dostępność + SEO.',
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({name: 'caption', title: 'Podpis', type: 'string'}),
    defineField({
      name: 'credit',
      title: 'Autor / licencja',
      type: 'string',
      description: 'np. „Fot. Anna Kowalska” albo „CC BY 4.0, Wikimedia Commons”.',
    }),
  ],
})
