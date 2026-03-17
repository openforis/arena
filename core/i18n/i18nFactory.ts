import i18next from 'i18next'
import * as ProcessUtils from '@core/processUtils'

import enTranslation from './resources/en'
import esTranslation from './resources/es'
import mnTranslation from './resources/mn'
import ptTranslation from './resources/pt'
import ruTranslation from './resources/ru'

const resources = {
  en: enTranslation,
  es: esTranslation,
  mn: mnTranslation,
  pt: ptTranslation,
  ru: ruTranslation,
}

export const defaultLanguage = 'en'

const namespaces = Object.keys(enTranslation)
const defaultNamespace = 'common'

export const supportedLanguages = Object.keys(resources)

const createParams = (lang: string = defaultLanguage) => ({
  fallbackLng: defaultLanguage,
  debug: ProcessUtils.isEnvDevelopment,

  // React i18next special options (optional)
  react: {
    wait: false,
    nsMode: 'default' as const,
  },
  lng: lang,
  ns: namespaces,
  defaultNS: defaultNamespace,
  resources,
  supportedLngs: supportedLanguages,
})

export const createI18nAsync = (lang: string = defaultLanguage): Promise<{ lang: string; t: unknown }> => {
  // Import and require return different objects
  const createInstance = (i18next as any).createInstance || (i18next as any).default.createInstance

  return new Promise((resolve, reject) => {
    createInstance(createParams(lang), (err: unknown, t: unknown) => {
      if (err) {
        reject(err)
        return
      }

      resolve({ lang, t })
    })
  })
}

const i18n = i18next.createInstance()
i18n.init(createParams() as any)

export default i18n
