import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as cookieParser from 'cookie-parser'
import * as fileUpload from 'express-fileupload'
import { createTerminus } from '@godaddy/terminus'

import * as ProcessUtils from '@core/processUtils'
import * as Log from '@server/log/log'
import { db } from '@server/db/db'

import * as authApi from '@server/modules/auth/api/authApi'
import * as WebSocket from '@server/utils/webSocket'
import * as headerMiddleware from './middleware/headerMiddleware'
import { jwtMiddleware } from './middleware/jwtMiddleware'
import * as errorMiddleware from './middleware/errorMiddleware'
import * as apiRouter from './apiRouter'
import * as RecordPreviewCleanup from './schedulers/recordPreviewCleanup'
import * as ExpiredJwtTokensCleanup from './schedulers/expiredJwtTokensCleanup'
import * as TempFilesCleanup from './schedulers/tempFilesCleanup'

export const run = async () => {
  const logger = Log.getLogger('AppCluster')

  logger.info('server initialization start')

  const app = express()

  // ====== app initializations
  app.use(bodyParser.json({ limit: '5000kb' }))
  app.use(cookieParser())
  app.use(
    fileUpload({
      // Limit upload to 1 GB
      limits: { fileSize: 1024 * 1024 * 1024 },
      abortOnLimit: true,
      useTempFiles: true,
      tempFileDir: ProcessUtils.ENV.tempFolder,
    }),
  )

  headerMiddleware.init(app)

  app.use(/^\/api.*|^\/auth.*/, jwtMiddleware)

  app.use(compression({ threshold: 512 }))

  app.use(/^\/$/, (req, res) => res.redirect('/app/home/'))

  const dist = ProcessUtils.ENV.arenaDist
  const imgDir = `${ProcessUtils.ENV.arenaRoot}/web-resources/img`
  app.use('/', express.static(dist))
  app.use('/app*', express.static(dist))
  app.use('/img/', express.static(imgDir))

  // ====== apis
  authApi.init(app)
  app.use('/api', apiRouter.router)

  // ====== error handling
  errorMiddleware.init(app)

  // ====== server
  const server = app.listen(ProcessUtils.ENV.port, () => {
    logger.info(
      `server initialization end - listening on port ${ProcessUtils.ENV.port}`,
    )
  })

  // ====== socket middleware
  WebSocket.init(server, jwtMiddleware)

  const onSignal = () => {
    logger.info('server is starting cleanup')
    db.end()
  }

  const onHealthCheck = async () => {
    // Checks if the system is healthy, like the db connection is live
    // resolves, if healthy, rejects if not
    await db.one('select 1 from "user" limit 1')
  }

  createTerminus(server, {
    signal: 'SIGINT',
    healthChecks: { '/healthcheck': onHealthCheck },
    onSignal,
  })

  // ====== schedulers
  await RecordPreviewCleanup.init()
  await ExpiredJwtTokensCleanup.init()
  await TempFilesCleanup.init()
}
