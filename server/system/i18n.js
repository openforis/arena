const path = require('path')

var i18next = require('i18next')
const Backend = require('i18next-node-fs-backend')

const { isEnvDevelopment } = require('../../common/processUtils')

const translate = async (resolve, lang) => {
  await i18next
    .use(Backend)
    .init({
      whitelist: ['en'],
      fallbackLng: 'en',
      preload: ['en'],

      debug: isEnvDevelopment(),

      interpolation: {
        escapeValue: false
      },

      backend: {
        loadPath: path.join(__dirname, '../../common/i18n/resources/{{lng}}.js'),
      }
    })

  i18next.changeLanguage(lang).then(resolve)
}

module.exports = {
  translate,
}
