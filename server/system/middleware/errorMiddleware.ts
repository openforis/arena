const Response = require('../../utils/response')

const Log = require('../../log/log')

const logger = Log.getLogger('App error')

module.exports.init = app => {

  app.use((err, req, res, next) => {
    logger.error(err.stack)
    Response.sendErr(res, err)
  })

}
