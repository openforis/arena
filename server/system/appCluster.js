import * as express from 'express'

import morgan from 'morgan'

import { ArenaServer } from '@openforis/arena-server'

import * as ProcessUtils from '@core/processUtils'

import * as Log from '@server/log/log'
import * as authConfig from '@server/modules/auth/config/authConfig'
import * as authApi from '@server/modules/auth/api/authApi'

import * as accessControlMiddleware from './middleware/accessControlMiddleware'

import * as apiRouter from './apiRouter'
import * as RecordPreviewCleanup from './schedulers/recordPreviewCleanup'
import * as TempFilesCleanup from './schedulers/tempFilesCleanup'
import * as UserResetPasswordCleanup from './schedulers/userResetPasswordCleanup'

export const run = async () => {
  const logger = Log.getLogger('AppCluster')

  logger.info('server initialization start')

  const arenaApp = await ArenaServer.init()
  const { express: app } = arenaApp

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

  await ArenaServer.start(arenaApp)

  // ====== schedulers
  await RecordPreviewCleanup.init()
  await TempFilesCleanup.init()
  await UserResetPasswordCleanup.init()
}
