import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import { createI18nParams } from '@core/i18n/i18nParams'
import { lazyLanguagesBackend } from '@core/i18n/languageLoaders'
import enTranslation from '@core/i18n/resources/en'

const i18nInstance = i18next.createInstance()

// only English is bundled: the other languages are loaded the first time they are used
i18nInstance
  .use(lazyLanguagesBackend)
  .use(initReactI18next)
  .init({
    ...createI18nParams({ resources: { en: enTranslation } }),
    partialBundledLanguages: true,
    // changeLanguage switches once the language is loaded: nothing to suspend
    react: { nsMode: 'default', useSuspense: false },
  })

export default i18nInstance
