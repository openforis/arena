const i18next = require('i18next')

const { isEnvDevelopment } = require('../../common/processUtils')

const enTranslation = require('./resources/en')

const createParams = lang => ({
  fallbackLng: 'en',
  debug: isEnvDevelopment(),

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

const createI18nPromise = lang => {
  return new Promise((resolve, reject) => {
    i18next.createInstance(
      createParams(lang),
      (err, t) => {
        if (err) reject(err)
        resolve({ lang, t })
      })
  })
}

module.exports.createI18nPromise = createI18nPromise
