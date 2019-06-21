const express = require('express')
const bodyParser = require('body-parser')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')

const sessionMiddleware = require('./middleware/sessionMiddleware')
const headerMiddleware = require('./middleware/headerMiddleware')
const accessControlMiddleware = require('./middleware/accessControlMiddleware')
// const authMiddleware = require('./middleware/authMiddleware')
const jwtMiddleware = require('./middleware/jwtMiddleware')
const errorMiddleware = require('./middleware/errorMiddleware')
const authApi = require('../modules/auth/api/authApi')
const apiRouter = require('./apiRouter')
const WebSocket = require('../utils/webSocket')
const RecordPreviewCleanup = require('./recordPreviewCleanup')

module.exports = async () => {

  const app = express()

// ====== app initializations
  app.use(bodyParser.json({ limit: '5000kb' }))
  app.use(cookieParser())
  app.use(fileUpload({
    //limit upload to 1 GB
    limits: { fileSize: 1024 * 1024 * 1024 },
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: '/tmp/',
  }))

  headerMiddleware.init(app)

  // app.use(sessionMiddleware)
  // authMiddleware.init(app)
  app.use(/^\/api.*/, jwtMiddleware)
// accessControlMiddleware must be initialized after authConfig
  accessControlMiddleware.init(app)

  app.use(compression({ threshold: 512 }))

  app.use('/', express.static(`${__dirname}/../../dist`))
  app.use('/app*', express.static(`${__dirname}/../../dist`))
  app.use('/img/', express.static(`${__dirname}/../../web-resources/img`))
// app.use('/css/', express.static(`${__dirname}/../web-resources/css`))

// ====== apis
  authApi.init(app)
  app.use('/api', apiRouter.router)

// ====== error handling
  app.use(await errorMiddleware('en'))

// ====== server
  const httpServerPort = process.env.PORT || '9090'

  const server = app.listen(httpServerPort, () => {
    console.log('server listening on port', httpServerPort)
  })

// ====== socket middleware
  WebSocket.init(server, sessionMiddleware) // TODO delete sessionMiddleware

// ====== scheduler
  await RecordPreviewCleanup.init()
}