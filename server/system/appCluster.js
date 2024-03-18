import * as express from 'express'
import morgan from 'morgan'

import { ArenaServer } from '@openforis/arena-server'

import * as ProcessUtils from '@core/processUtils'

import * as Log from '@server/log/log'
import * as authApi from '@server/modules/auth/api/authApi'
import * as UserService from '@server/modules/user/service/userService'

import * as apiRouter from './apiRouter'
import * as TemporarySurveysCleanup from './schedulers/temporarySurveysCleanup'
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
  app.use(/^\/$/, (req, res) => res.redirect('/app/home/'))

  const dist = ProcessUtils.ENV.arenaDist

  const { arenaRoot } = ProcessUtils.ENV

  // static resources
  app.use('/', express.static(dist))
  app.use('/app*', express.static(dist))
  app.use('/guest/*', express.static(dist))
  const imgDir = `${arenaRoot}/web-resources/img`
  app.use('/img/', express.static(imgDir))
  app.use('/noHeader/*', express.static(dist))

  // ====== APIs
  authApi.init(app)
  app.use('/api', apiRouter.router)

  await ArenaServer.start(arenaApp)

  // ====== System Admin user creation
  await UserService.insertSystemAdminUserIfNotExisting()

  // ====== Schedulers
  await TempFilesCleanup.init()
  await UserResetPasswordCleanup.init()
  await TemporarySurveysCleanup.init()
  await RecordPreviewCleanup.init()
  // await ExpiredUserInvitationsCleanup.init()
}
