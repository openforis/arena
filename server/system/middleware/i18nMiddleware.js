const path = require('path')

var i18next = require('i18next')
const Backend = require('i18next-node-fs-backend')
var i18nextMiddleware = require('i18next-express-middleware')

const { isEnvDevelopment } = require('../../../common/processUtils')

const init = app => {
  i18next
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
        loadPath: path.join(__dirname, '../../../common/i18n/resources/{{lng}}.js'),
      }
    })

  app.use(
    i18nextMiddleware.handle(i18next)
  )
}

module.exports = {
  init,
}
