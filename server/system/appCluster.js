import * as express from 'express'
import morgan from 'morgan'

import { ServiceType } from '@openforis/arena-core'
import { ArenaServer } from '@openforis/arena-server'

import * as ProcessUtils from '@core/processUtils'

import * as Log from '@server/log/log'
import * as authApi from '@server/modules/auth/api/authApi'
import * as FileService from '@server/modules/record/service/fileService'
import * as UserService from '@server/modules/user/service/userService'

import * as apiRouter from './apiRouter'
import { DataMigrator } from './dataMigrator'
import * as ExpiredUserInvitationsCleanup from './schedulers/expiredUserInvitationsCleanup'
import * as RecordPreviewCleanup from './schedulers/recordPreviewCleanup'
import * as TempFilesCleanup from './schedulers/tempFilesCleanup'
import * as TemporarySurveysCleanup from './schedulers/temporarySurveysCleanup'
import * as UserResetPasswordCleanup from './schedulers/userResetPasswordCleanup'
import { SwaggerInitializer } from './swaggerInitializer'

const fileSizeLimit = 2 * 1024 * 1024 * 1024 // 2GB

export const run = async () => {
  const logger = Log.getLogger('AppCluster')

  logger.info('server initialization start')

  const arenaApp = await ArenaServer.init({ fileSizeLimit })
  const { express: app, serviceRegistry } = arenaApp

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

  SwaggerInitializer.init(app)

  // Data migrations
  await DataMigrator.migrateData({ logger, serviceRegistry })

  // ====== System Admin user creation
  await UserService.insertSystemAdminUserIfNotExisting()

  // run files storage check after DB migrations
  await FileService.checkFilesStorage()

  // ====== Update app version in DB
  const infoService = serviceRegistry.getService(ServiceType.info)
  await infoService.updateVersion()

  // ====== Start server
  await ArenaServer.start(arenaApp)

  // ====== Schedulers
  await TempFilesCleanup.init()
  await UserResetPasswordCleanup.init()
  await TemporarySurveysCleanup.init()
  await RecordPreviewCleanup.init()
  // await SurveysFilesPropsCleanup.init()
  await ExpiredUserInvitationsCleanup.init()

  logger.info('server initialization complete; server started.')
}
