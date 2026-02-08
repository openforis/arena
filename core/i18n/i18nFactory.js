import i18next from 'i18next'
import * as ProcessUtils from '@core/processUtils'

import enTranslation from './resources/en'
import esTranslation from './resources/es'
import mnTranslation from './resources/mn'
import ruTranslation from './resources/ru'

const resources = {
  en: enTranslation,
  es: esTranslation,
  mn: mnTranslation,
  ru: ruTranslation,
}

export const defaultLanguage = 'en'

const namespaces = Object.keys(enTranslation)
const defaultNamespace = 'common'

export const supportedLanguages = Object.keys(resources)

const createParams = (lang = defaultLanguage) => ({
  fallbackLng: defaultLanguage,
  debug: ProcessUtils.isEnvDevelopment,

  // React i18next special options (optional)
  react: {
    wait: false, // Set to true if you like to wait for loaded in every translated hoc
    nsMode: 'default', // Set it to fallback to let passed namespaces to translated hoc act as fallbacks
  },
  lng: lang,
  ns: namespaces,
  defaultNS: defaultNamespace,
  resources,
  supportedLngs: supportedLanguages,
})

export const createI18nAsync = (lang = defaultLanguage) => {
  // Import and require return different objects
  const createInstance = i18next.createInstance || i18next.default.createInstance

  return new Promise((resolve, reject) => {
    createInstance(createParams(lang), (err, t) => {
      if (err) {
        reject(err)
        return
      }

      resolve({ lang, t })
    })
  })
}

const i18n = i18next.createInstance()
i18n.init(createParams())

export default i18n
