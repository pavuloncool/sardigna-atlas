import {PinIcon} from '@sanity/icons/Pin'
import {defineField, defineType} from 'sanity'
import {tagsField} from '../lib/fields'
import {slugFromLocalized} from '../lib/slugFromLocalized'

/**
 * Miejsce to węzeł hierarchii: region → miasto → wieś/wybrzeże/atrakcja.
 * Strona regionu agreguje treści ze wszystkich potomków (zapytania GROQ obsługują do 3 poziomów).
 */
export const place = defineType({
  name: 'place',
  title: 'Miejsce',
  type: 'document',
  icon: PinIcon,
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
          {title: 'Region (np. Barbagia)', value: 'region'},
          {title: 'Miasto (np. Nuoro)', value: 'city'},
          {title: 'Wieś / miasteczko (np. Orgosolo)', value: 'village'},
          {title: 'Wybrzeże / plaża', value: 'coast'},
          {title: 'Atrakcja / obiekt', value: 'landmark'},
        ],
      },
      initialValue: 'village',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'parent',
      title: 'Nadrzędne miejsce',
      type: 'reference',
      to: [{type: 'place'}],
      description: 'np. Orgosolo → Barbagia. Maksymalnie 3 poziomy.',
      validation: (Rule) =>
        Rule.custom((parent, context) => {
          const id = (context.document?._id ?? '').replace(/^drafts\./, '')
          const ref = (parent as {_ref?: string} | undefined)?._ref
          return ref && ref === id ? 'Miejsce nie może być własnym rodzicem.' : true
        }),
    }),
    defineField({
      name: 'mapId',
      title: 'ID regionu na mapie SVG',
      type: 'string',
      description: 'Subregion na mapie Atlasu (29 subregionów, lista z scripts/map/subregions.csv). Bez wyboru subregion na mapie jest wygaszony („wkrótce”).',
      options: {
        list: [
          {title: 'Gallura', value: 'gallura'},
          {title: 'Nurra', value: 'nurra'},
          {title: 'Romangia', value: 'romangia'},
          {title: 'Anglona', value: 'anglona'},
          {title: 'Sassarese', value: 'sassarese'},
          {title: 'Monte Acuto (Montacuto)', value: 'monte-acuto'},
          {title: 'Baronie', value: 'baronie'},
          {title: 'Meilogu', value: 'meilogu'},
          {title: 'Gocèano', value: 'goceano'},
          {title: 'Planargia', value: 'planargia'},
          {title: 'Marghine', value: 'marghine'},
          {title: 'Montiferru', value: 'montiferru'},
          {title: 'Barbagia di Nuoro', value: 'barbagia-di-nuoro'},
          {title: 'Barbagia di Ollolai', value: 'barbagia-di-ollolai'},
          {title: 'Mandrolisai', value: 'mandrolisai'},
          {title: 'Barbagia di Belvì', value: 'barbagia-di-belvi'},
          {title: 'Barbagia di Seùlo', value: 'barbagia-di-seulo'},
          {title: 'Campidano di Oristano', value: 'campidano-di-oristano'},
          {title: 'Barigadu', value: 'barigadu'},
          {title: 'Ogliastra', value: 'ogliastra'},
          {title: 'Sarcidano', value: 'sarcidano'},
          {title: 'Marmilla', value: 'marmilla'},
          {title: 'Trexenta', value: 'trexenta'},
          {title: 'Quirra', value: 'quirra'},
          {title: 'Monreale (Campidano di Sanluri)', value: 'monreale'},
          {title: 'Sarrabus-Gerrei', value: 'sarrabus-gerrei'},
          {title: 'Partèolla', value: 'parteolla'},
          {title: 'Campidano di Cagliari', value: 'campidano-di-cagliari'},
          {title: 'Sulcis-Iglesiente', value: 'sulcis-iglesiente'},
        ],
      },
      hidden: ({document}) => document?.kind !== 'region',
    }),
    defineField({name: 'summary', title: 'Opis', type: 'localizedText'}),
    defineField({name: 'cover', title: 'Zdjęcie', type: 'mediaImage'}),
    defineField({name: 'coordinates', title: 'Współrzędne', type: 'geopoint'}),
    tagsField(),
  ],
  preview: {
    select: {title: 'name.pl', kind: 'kind', parent: 'parent.name.pl', media: 'cover'},
    prepare: ({title, kind, parent, media}) => ({
      title,
      subtitle: [kind, parent && `→ ${parent}`].filter(Boolean).join(' '),
      media,
    }),
  },
})
