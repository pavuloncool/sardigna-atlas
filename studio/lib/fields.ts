import {defineArrayMember, defineField} from 'sanity'

/**
 * Tagi (sekcja 5a briefu): redaktor tylko taguje, a bloki „Powiązane” liczą się w buildzie.
 * Pole jest dodawane do article oraz do wszystkich encji.
 */
export const tagsField = (group?: string) =>
  defineField({
    name: 'tags',
    title: 'Tagi',
    type: 'array',
    group,
    description:
      'Wystarczy otagować treść: powiązania z innymi artykułami i miejscami powstają automatycznie.',
    of: [defineArrayMember({type: 'reference', to: [{type: 'tag'}]})],
    validation: (Rule) => Rule.unique(),
  })

/**
 * Afiliacja (sekcja 12): każda encja trzyma własny link i nazwę sieci,
 * szablon nie wie, z jakiej sieci pochodzi link. Tylko zwykłe linki, bez widgetów.
 */
export const affiliateFields = [
  defineField({
    name: 'affiliateUrl',
    title: 'Link afiliacyjny',
    type: 'url',
    description: 'Zwykły link https z identyfikatorem partnera. Bez widgetów i iframe’ów.',
    validation: (Rule) =>
      Rule.uri({scheme: ['https']}).error('Dozwolony tylko poprawny adres zaczynający się od https://'),
  }),
  defineField({
    name: 'affiliateNetwork',
    title: 'Sieć afiliacyjna',
    type: 'string',
    description: 'Tylko do wiadomości redakcji (np. nazwa sieci albo „umowa bezpośrednia”).',
  }),
  defineField({
    name: 'isAffiliate',
    title: 'Oznacz jako link afiliacyjny',
    type: 'boolean',
    description: 'Zaznacz, jeśli zarabiasz na kliknięciu. Front pokaże widoczną etykietę.',
    initialValue: false,
  }),
  defineField({
    name: 'isSponsored',
    title: 'Treść sponsorowana',
    type: 'boolean',
    initialValue: false,
  }),
]
