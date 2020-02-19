import * as Request from '@server/utils/request'
import * as Log from '@server/log/log'

const logger = Log.getLogger('Https Middleware')

export const init = app => {
  app.use((req, res, next) => {
    if (Request.isHttps(req)) {
      next()
    } else {
      const url = `https://${Request.getHost(req)}${Request.getUrl(req)}`
      logger.info(`redirecting to ${url}`)
      res.redirect(url)
    }
  })
}
