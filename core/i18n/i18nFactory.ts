import i18next, { i18n, InitOptions } from 'i18next'

import { ArenaI18n } from '@openforis/arena-core'

import { createI18nParams } from './i18nParams'
import { lazyLanguagesBackend } from './languageLoaders'
import enTranslation from './resources/en'
import { defaultLanguage } from './uiLanguages'

export { defaultLanguage, supportedLanguages } from './uiLanguages'

// only English is bundled: the other languages are loaded when an instance uses them
const createParams = (lang?: string): InitOptions => ({
  ...createI18nParams({ lang, resources: { en: enTranslation } }),
  partialBundledLanguages: true,
})

const createInstance = (): i18n => i18next.createInstance().use(lazyLanguagesBackend)

/**
 * Creates an i18n instance in the specified language, once the language is loaded.
 */
export const createI18nAsync = (lang: string = defaultLanguage): Promise<ArenaI18n & { lang: string }> => {
  const instance = createInstance()
  return new Promise((resolve, reject) => {
    instance.init(createParams(lang), (err: unknown, t) => {
      if (err) {
        reject(err)
        return
      }
      resolve({ lang, t, exists: instance.exists })
    })
  })
}

// in English
const i18nInstance = createInstance()
i18nInstance.init(createParams())

export default i18nInstance
