import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import type {StructureResolver} from 'sanity/structure'
import {ENABLED_LANGUAGES} from './lib/languages'

// Dokumenty pomocnicze wtyczki tłumaczeń nie powinny być widoczne dla redaktora.
const HIDDEN_TYPES = ['translation.metadata']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Treść')
    .items([
      S.listItem()
        .title('Artykuły')
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title('Artykuły')
            .items([
              S.listItem().title('Wszystkie').child(S.documentTypeList('article').title('Wszystkie artykuły')),
              ...ENABLED_LANGUAGES.map((lang) =>
                S.listItem()
                  .title(lang.title)
                  .child(
                    S.documentList()
                      .title(`Artykuły — ${lang.title}`)
                      .filter('_type == "article" && language == $lang')
                      .params({lang: lang.id}),
                  ),
              ),
            ]),
        ),
      S.divider(),
      ...S.documentTypeListItems().filter((item) => !['article', ...HIDDEN_TYPES].includes(item.getId() ?? '')),
    ])
