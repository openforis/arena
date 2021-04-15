import * as express from 'express'
import { createTerminus } from '@godaddy/terminus'

import morgan from 'morgan'

import { ArenaServer } from '@openforis/arena-server'

import * as ProcessUtils from '@core/processUtils'

import * as Log from '@server/log/log'
import { db } from '@server/db/db'
import * as authConfig from '@server/modules/auth/config/authConfig'
import * as authApi from '@server/modules/auth/api/authApi'
import * as WebSocket from '@server/utils/webSocket'

import * as accessControlMiddleware from './middleware/accessControlMiddleware'

import sessionMiddleware from './middleware/sessionMiddleware'

import * as apiRouter from './apiRouter'
import * as RecordPreviewCleanup from './schedulers/recordPreviewCleanup'
import * as TempFilesCleanup from './schedulers/tempFilesCleanup'
import * as UserResetPasswordCleanup from './schedulers/userResetPasswordCleanup'

export const run = async () => {
  const logger = Log.getLogger('AppCluster')

  logger.info('server initialization start')

  const { express: app } = await ArenaServer.init()

  if (ProcessUtils.isEnvDevelopment) {
    app.use(morgan('dev'))
  }

  // ====== app initializations

  authConfig.init(app)
  // AccessControlMiddleware must be initialized after authConfig
  accessControlMiddleware.init(app)

  app.use(/^\/$/, (req, res) => res.redirect('/app/home/'))

  const dist = ProcessUtils.ENV.arenaDist

  const { arenaRoot } = ProcessUtils.ENV

  const imgDir = `${arenaRoot}/web-resources/img`
  app.use('/', express.static(dist))
  app.use('/app*', express.static(dist))
  app.use('/img/', express.static(imgDir))
  app.use('/guest/*', express.static(dist))

  // ====== APIs
  authApi.init(app)
  app.use('/api', apiRouter.router)

  // TODO replace the following part with ArenaServer.start

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
