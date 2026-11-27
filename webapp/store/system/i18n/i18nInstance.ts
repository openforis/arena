import i18next, { BackendModule, ResourceLanguage } from 'i18next'
import { initReactI18next } from 'react-i18next'

import { createI18nParams } from '@core/i18n/i18nParams'
import enTranslation from '@core/i18n/resources/en'

type LanguageModule = { default: ResourceLanguage }

// one chunk per language, downloaded the first time the language is used (English is in the main bundle)
export const languageLoaders: Record<string, () => Promise<LanguageModule>> = {
  de: () => import('@core/i18n/resources/de'),
  es: () => import('@core/i18n/resources/es'),
  fr: () => import('@core/i18n/resources/fr'),
  id: () => import('@core/i18n/resources/id'),
  ja: () => import('@core/i18n/resources/ja'),
  mn: () => import('@core/i18n/resources/mn'),
  pt: () => import('@core/i18n/resources/pt'),
  ru: () => import('@core/i18n/resources/ru'),
  sr: () => import('@core/i18n/resources/sr'),
}

const lazyLanguagesBackend: BackendModule = {
  type: 'backend',
  init: () => {},
  read: (lang, namespace, callback) => {
    const loader = languageLoaders[lang]
    if (!loader) {
      callback(null, {})
      return
    }
    loader()
      // a namespace missing in a language (e.g. emails) falls back to English
      .then((module) => callback(null, module.default[namespace] ?? {}))
      .catch((error: Error) => callback(error, null))
  },
}

const i18nInstance = i18next.createInstance()

i18nInstance
  .use(lazyLanguagesBackend)
  .use(initReactI18next)
  .init({
    ...createI18nParams({ resources: { en: enTranslation } }),
    // the backend loads only the languages not in the resources
    partialBundledLanguages: true,
    // changeLanguage switches once the language is loaded: nothing to suspend
    react: { nsMode: 'default', useSuspense: false },
  })

export default i18nInstance
