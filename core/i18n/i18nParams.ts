import type { InitOptions, Resource } from 'i18next'

import * as ProcessUtils from '@core/processUtils'

import enTranslation from './resources/en'
import { defaultLanguage, supportedLanguages } from './uiLanguages'

const namespaces = Object.keys(enTranslation)
const defaultNamespace = 'common'

/**
 * Returns the i18next options shared by the server and the webapp instances.
 */
export const createI18nParams = ({
  lang = defaultLanguage,
  resources,
}: {
  lang?: string
  resources: Resource
}): InitOptions => ({
  fallbackLng: defaultLanguage,
  debug: ProcessUtils.isEnvDevelopment,
  react: {
    nsMode: 'default',
  },
  lng: lang,
  ns: namespaces,
  defaultNS: defaultNamespace,
  resources,
  supportedLngs: supportedLanguages,
})
