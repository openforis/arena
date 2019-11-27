import * as Response from '@server/utils/response'

import * as Log from '@server/log/log'

const logger = Log.getLogger('App error')

export const init = app => {
  app.use((err, _req, res, _next) => {
    logger.error(err.stack)
    Response.sendErr(res, err)
  })
}
