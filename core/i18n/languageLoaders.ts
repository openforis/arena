import type { BackendModule, ResourceLanguage } from 'i18next'

type LanguageModule = { default: ResourceLanguage }

// one chunk per language (in the webapp and in the server bundles), loaded the first time the language is used:
// only English is always loaded
export const languageLoaders: Record<string, () => Promise<LanguageModule>> = {
  de: () => import('./resources/de'),
  es: () => import('./resources/es'),
  fr: () => import('./resources/fr'),
  id: () => import('./resources/id'),
  ja: () => import('./resources/ja'),
  mn: () => import('./resources/mn'),
  pt: () => import('./resources/pt'),
  ru: () => import('./resources/ru'),
  sr: () => import('./resources/sr'),
}

/**
 * The i18next backend loading the languages that are not in the resources of the instance.
 */
export const lazyLanguagesBackend: BackendModule = {
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
