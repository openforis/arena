import i18next, { i18n, TFunction } from 'i18next'

import { I18n } from '@openforis/arena-core'

import * as ProcessUtils from '@core/processUtils'

import enTranslation from './resources/en'
import esTranslation from './resources/es'
import frTranslation from './resources/fr'
import mnTranslation from './resources/mn'
import ptTranslation from './resources/pt'
import ruTranslation from './resources/ru'

const resources = {
  en: enTranslation,
  es: esTranslation,
  fr: frTranslation,
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

export const createI18nAsync = (lang: string = defaultLanguage): Promise<I18n & { lang: string }> => {
  const createInstance = i18next.createInstance || (i18next as any).default.createInstance

  return new Promise((resolve, reject) => {
    const instance: i18n = createInstance()
    instance.init(createParams(lang), (err: unknown, t: TFunction) => {
      if (err) {
        reject(err)
        return
      }
      resolve({ lang, t, exists: instance.exists })
    })
  })
}

const i18nInstance = i18next.createInstance()
i18nInstance.init(createParams() as any)

export default i18nInstance
