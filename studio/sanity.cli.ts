import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'rkr99tu3',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // Studio hostowane przez Sanity: `npx sanity deploy` → https://<nazwa>.sanity.studio
  studioHost: process.env.SANITY_STUDIO_HOST,
  typegen: {
    enabled: true,
    path: '../web/{app,lib,components}/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../web/sanity.types.ts',
    overloadClientMethods: true,
  },
  deployment: {
    appId: 'wi3ca19uimqiio7rtpp9btne',
    autoUpdates: true,
  },
})
