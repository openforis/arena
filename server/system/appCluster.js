const express = require('express')
const bodyParser = require('body-parser')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const { createTerminus } = require('@godaddy/terminus')

const ProcessUtils = require('@core/processUtils')
const Log = require('@server/log/log')
const db = require('@server/db/db')

const headerMiddleware = require('./middleware/headerMiddleware')
const jwtMiddleware = require('./middleware/jwtMiddleware')
const errorMiddleware = require('./middleware/errorMiddleware')
const authApi = require('@server/modules/auth/api/authApi')
const apiRouter = require('./apiRouter')
const WebSocket = require('@server/utils/webSocket')
const RecordPreviewCleanup = require('./schedulers/recordPreviewCleanup')
const ExpiredJwtTokensCleanup = require('./schedulers/expiredJwtTokensCleanup')
const TempFilesCleanup = require('./schedulers/tempFilesCleanup')

module.exports = async () => {
  const logger = Log.getLogger('AppCluster')

  logger.info(`server initialization start`)

  const app = express()

  // ====== app initializations
  app.use(bodyParser.json({ limit: '5000kb' }))
  app.use(cookieParser())
  app.use(fileUpload({
    // limit upload to 1 GB
    limits: { fileSize: 1024 * 1024 * 1024 },
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: ProcessUtils.ENV.tempFolder,
  }))

  headerMiddleware.init(app)

  app.use(/^\/api.*|^\/auth.*/, jwtMiddleware)

  app.use(compression({ threshold: 512 }))

  app.use(/^\/$/, (req, res) => res.redirect('/app/home'))

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
    logger.info(`server initialization end - listening on port ${ProcessUtils.ENV.port}`)
  })

  // ====== socket middleware
  WebSocket.init(server, jwtMiddleware)

  const onSignal = () => {
    logger.info('server is starting cleanup')
    db.end()
  }

  const onHealthCheck = async () => {
    // checks if the system is healthy, like the db connection is live
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