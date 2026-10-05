import {defineArrayMember, defineField} from 'sanity'

/**
 * Rodzaje współpracy z markami i twórcami. Etykieta dla czytelnika jest wyliczana na froncie
 * (components/PartnershipNote.tsx); `affiliate` wykrywany jest także automatycznie z `affiliateUrl`.
 */
export const partnershipTypes = [
  {title: 'Brak', value: 'none'},
  {title: 'Linki afiliacyjne', value: 'affiliate'},
  {title: 'Materiał sponsorowany (reklama)', value: 'sponsored'},
  {title: 'Współpraca reklamowa z marką/twórcą', value: 'collaboration'},
  {title: 'Produkt przekazany przez producenta (barter)', value: 'gifted'},
] as const

/** Rodzaje współpracy na poziomie marki (relacja stała, nie pojedynczego artykułu). */
export const brandPartnershipTypes = [
  {title: 'Brak współpracy', value: 'none'},
  {title: 'Afiliacja', value: 'affiliate'},
  {title: 'Sponsor', value: 'sponsor'},
  {title: 'Barter (produkty w zamian za wzmiankę)', value: 'barter'},
] as const

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
