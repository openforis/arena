const i18next = require('i18next')

const enTranslation = require('./resources/en')
const frTranslation = require('./resources/fr')

const createParams = lang => ({
  fallbackLng: 'en',
  debug: true,

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
    fr: {
      translation: frTranslation,
    },
  },
})

const createI18nPromise = (language) => {
  return new Promise((resolve, reject) => {
    i18next.createInstance(
      createParams(language),
      (err, t) => {
        if (err) reject(err)
        resolve({ language, t }) // TODO: wrapper
      })
  })
}

module.exports.createI18nPromise = createI18nPromise
