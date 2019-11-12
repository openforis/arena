import i18next from 'i18next';

import * as ProcessUtils from '@core/processUtils'

import { enTranslation } from './resources/en'

const createParams = lang => ({
  fallbackLng: 'en',
  debug: ProcessUtils.isEnvDevelopment,

  // react i18next special options (optional)
  react: {
    wait: false, // set to true if you like to wait for loaded in every translated hoc
    nsMode: 'default', // set it to fallback to let passed namespaces to translated hoc act as fallbacks
  },
  lng: lang,
  resources: {
    en: {
      translation: enTranslation,
    },
  },
})

export const createI18nPromise = lang => {
  // import and require return different objects
  const createInstance = i18next.createInstance || i18next.default.createInstance

  return new Promise((resolve, reject) => {
    createInstance(
      createParams(lang),
      (err, t) => {
        if (err) reject(err)
        resolve({ lang, t })
      })
  })
}
