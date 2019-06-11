const response = require('../../utils/response')

const i18nFactory = require('../../../common/i18n/i18nFactory')

const Log = require('../../log/log')

const init = async lang => {
  const logger = Log.getLogger('App error')
  const i18n = await i18nFactory.createI18nPromise(lang)

  return (err, req, res, next) => {
    logger.error(i18n.t(`appErrors.${err.key}`, err.params))
    response.sendErr(res, err)
  }
}

module.exports = init