import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as cookieParser from 'cookie-parser'
import * as fileUpload from 'express-fileupload'
import { createTerminus } from '@godaddy/terminus'

import * as ProcessUtils from '@core/processUtils'

import path from 'path'
import morgan from 'morgan'

import * as Log from '@server/log/log'
import { db } from '@server/db/db'
import * as authConfig from '@server/modules/auth/config/authConfig'
import * as authApi from '@server/modules/auth/api/authApi'
import * as WebSocket from '@server/utils/webSocket'

import * as accessControlMiddleware from './middleware/accessControlMiddleware'
import * as errorMiddleware from './middleware/errorMiddleware'
import * as headerMiddleware from './middleware/headerMiddleware'
import sessionMiddleware from './middleware/sessionMiddleware'
import * as httpsMiddleware from './middleware/httpsMiddleware'

import * as apiRouter from './apiRouter'
import * as RecordPreviewCleanup from './schedulers/recordPreviewCleanup'
import * as TempFilesCleanup from './schedulers/tempFilesCleanup'
import * as UserResetPasswordCleanup from './schedulers/userResetPasswordCleanup'

export const run = async () => {
  const logger = Log.getLogger('AppCluster')

  logger.info('server initialization start')

  const app = express()

  if (ProcessUtils.isEnvDevelopment) {
    app.use(morgan('dev'))
  }

  // ====== app initializations
  if (ProcessUtils.ENV.useHttps) {
    httpsMiddleware.init(app)
  }

  app.use(bodyParser.json({ limit: '5000kb' }))
  app.use(cookieParser())
  app.use(
    fileUpload({
      // Limit upload to 1 GB
      limits: { fileSize: 1024 * 1024 * 1024 },
      abortOnLimit: true,
      useTempFiles: true,
      tempFileDir: ProcessUtils.ENV.tempFolder,
    })
  )

  headerMiddleware.init(app)
  app.use(sessionMiddleware)
  authConfig.init(app)
  // AccessControlMiddleware must be initialized after authConfig
  accessControlMiddleware.init(app)

  app.use(compression({ threshold: 512 }))

  app.use(/^\/$/, (req, res) => res.redirect('/app/home/'))

  const arenaDist = path.resolve( __dirname, '../../','dist')
  const dist = arenaDist // ProcessUtils.ENV.arenaDist

  logger.info('dist', dist)
  const arenaRoot = path.resolve( __dirname, '../../') // ProcessUtils.ENV.arenaRoot

  const imgDir = `${arenaRoot}/web-resources/img`
  app.use('/', express.static(dist))
  app.use('/app*', express.static(dist))
  app.use('/img/', express.static(imgDir))
  app.use('/guest/*', express.static(dist))

  // ====== apis
  authApi.init(app)
  app.use('/api', apiRouter.router)

  // ====== error handling
  errorMiddleware.init(app)

  // ====== server
  const server = app.listen(ProcessUtils.ENV.arenaPort, () => {
    logger.info(`server initialization end - listening on port ${ProcessUtils.ENV.arenaPort}`)
  })

  // ====== socket middleware
  WebSocket.init(server, sessionMiddleware)

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
  await TempFilesCleanup.init()
  await UserResetPasswordCleanup.init()
}
