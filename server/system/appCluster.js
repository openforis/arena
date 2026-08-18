import * as express from 'express'
import morgan from 'morgan'

import { ServiceType } from '@openforis/arena-core'
import { ArenaServer } from '@openforis/arena-server'

import * as ProcessUtils from '@core/processUtils'

import * as JobManager from '@server/job/jobManager'
import * as Log from '@server/log/log'
import * as authApi from '@server/modules/auth/api/authApi'
import AllSurveysDataMigrationJob from '@server/modules/survey/service/dataMigration/allSurveysDataMigrationJob'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as UserService from '@server/modules/user/service/userService'

import * as apiRouter from './apiRouter'
import * as ExpiredUserInvitationsCleanup from './schedulers/expiredUserInvitationsCleanup'
import * as RecordPreviewCleanup from './schedulers/recordPreviewCleanup'
import * as TempFilesCleanup from './schedulers/tempFilesCleanup'
import * as TemporarySurveysCleanup from './schedulers/temporarySurveysCleanup'
import * as UserResetPasswordCleanup from './schedulers/userResetPasswordCleanup'
import * as UserTempAuthTokensCleanup from './schedulers/userTempAuthTokensCleanup'
import { SwaggerInitializer } from './swaggerInitializer'

export const run = async () => {
  const logger = Log.getLogger('AppCluster')

  logger.info('server initialization start')

  // ArenaServer.init() still synchronously migrates every survey's schema at startup, via arena-server's own
  // DBMigrator.migrateAll() (public schema + a loop over every survey's schema). That survey-schema loop is
  // now redundant with AllSurveysDataMigrationJob's own DBMigrator.migrateSurveySchema call (below), but there's
  // currently no way to opt out of just that loop while keeping the public-schema migration this app still
  // needs synchronously here. arena-server's feat/survey-migration branch adds ArenaServer.init({
  // migrateSurveySchemas: false }) for exactly this; once a release containing it is published and this
  // repo's @openforis/arena-server dependency is bumped, switch to it here and remove this redundancy.
  const arenaApp = await ArenaServer.init()
  const { express: app, serviceRegistry } = arenaApp

  if (ProcessUtils.isEnvDevelopment) {
    app.use(morgan('dev'))
  }

  // ====== app initializations
  app.use(/^\/$/, (req, res) => res.redirect('/app/home/'))

  const { arenaRoot, arenaDist: dist } = ProcessUtils.ENV

  // static resources
  app.use('/', express.static(dist))
  app.use('/app{/*path}', express.static(dist))
  app.use('/guest{/*path}', express.static(dist))
  const imgDir = `${arenaRoot}/web-resources/img`
  app.use('/img', express.static(imgDir))
  app.use('/noHeader{/*path}', express.static(dist))

  // ====== APIs
  authApi.init(app)
  app.use('/api', apiRouter.router)

  SwaggerInitializer.init(app)

  // ====== System Admin user creation
  await UserService.insertSystemAdminUserIfNotExisting()

  // run files storage check after DB migrations
  await SurveyFileService.checkFilesStorage()

  // Migrate surveys data in the background, without blocking server startup;
  // enqueued after checkFilesStorage (above) completes, so the two do not concurrently move the same survey files
  const adminUser = await UserManager.fetchUserByEmail(ProcessUtils.ENV.adminEmail)
  if (adminUser) {
    JobManager.enqueueJob(new AllSurveysDataMigrationJob({ user: adminUser }))
  } else {
    const message = `cannot start surveys data migration job: system admin user not found for ADMIN_EMAIL "${ProcessUtils.ENV.adminEmail}"; check that ADMIN_EMAIL is correctly configured and that a matching system admin user exists`
    logger.error(message)
    throw new Error(message)
  }

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
  await UserTempAuthTokensCleanup.init()

  logger.info('server initialization complete; server started.')
}
