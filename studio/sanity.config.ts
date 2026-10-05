import {documentInternationalization} from '@sanity/document-internationalization'
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {API_VERSION, ENABLED_LANGUAGES} from './lib/languages'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'sardigna-atlas',
  title: 'Sardigna Atlas — Studio',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'rkr99tu3',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [
    structureTool({structure}),
    visionTool({defaultApiVersion: API_VERSION}),
    documentInternationalization({
      supportedLanguages: ENABLED_LANGUAGES.map(({id, title}) => ({id, title})),
      schemaTypes: ['article'],
      languageField: 'language',
      weakReferences: true,
    }),
  ],
  schema: {types: schemaTypes},
})
