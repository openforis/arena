import i18next, { i18n, TFunction } from 'i18next'

import { ArenaI18n } from '@openforis/arena-core'

import { createI18nParams } from './i18nParams'
import deTranslation from './resources/de'
import enTranslation from './resources/en'
import esTranslation from './resources/es'
import frTranslation from './resources/fr'
import idTranslation from './resources/id'
import jaTranslation from './resources/ja'
import mnTranslation from './resources/mn'
import ptTranslation from './resources/pt'
import ruTranslation from './resources/ru'
import srTranslation from './resources/sr'
import { defaultLanguage } from './uiLanguages'

// every language of the app, all loaded: for the server and the unit tests (the webapp loads them when used)
export const resources = {
  de: deTranslation,
  en: enTranslation,
  es: esTranslation,
  fr: frTranslation,
  id: idTranslation,
  ja: jaTranslation,
  mn: mnTranslation,
  pt: ptTranslation,
  ru: ruTranslation,
  sr: srTranslation,
}

export { defaultLanguage, supportedLanguages } from './uiLanguages'

export const createI18nAsync = (lang: string = defaultLanguage): Promise<ArenaI18n & { lang: string }> => {
  const createInstance = i18next.createInstance || (i18next as any).default.createInstance

  return new Promise((resolve, reject) => {
    const instance: i18n = createInstance()
    instance.init(createI18nParams({ lang, resources }), (err: unknown, t: TFunction) => {
      if (err) {
        reject(err)
        return
      }
      resolve({ lang, t, exists: instance.exists })
    })
  })
}

const i18nInstance = i18next.createInstance()
i18nInstance.init(createI18nParams({ resources }))

export default i18nInstance
