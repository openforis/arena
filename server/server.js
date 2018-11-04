require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const io = require('socket.io')()

const sessionMiddleware = require('./config/sessionMiddleware')
const headerMiddleware = require('./config/headerMiddleware')
const accessControlMiddleware = require('./config/accessControlMiddleware')
const authConfig = require('./auth/authConfig')
const authApi = require('./auth/authApi')
const apiRouter = require('./config/apiRouter')
// const { fetchActiveJobByUserId } = require('./job/jobManager')
// run database migrations
require('./db/migration/public/execMigrations')()

const app = express()

// app initializations
app.use(bodyParser.json({limit: '5000kb'}))
app.use(cookieParser())
app.use(fileUpload({
  //limit upload to 50MB
  limits: { fileSize: 50 * 1024 * 1024 },
}))

headerMiddleware.init(app)
// sessionMiddleware.init(app)
app.use(sessionMiddleware)
authConfig.init(app)
//accesscontrolmiddleware must be initialized after authConfig
accessControlMiddleware.init(app)

app.use(compression({threshold: 512}))

app.use('/', express.static(`${__dirname}/../dist`))
app.use('/app*', express.static(`${__dirname}/../dist`))

app.use('/img/', express.static(`${__dirname}/../web-resources/img`))
// app.use('/css/', express.static(`${__dirname}/../web-resources/css`))

//apis
authApi.init(app)
app.use('/api', apiRouter.router)

const httpServerPort = process.env.PORT || '9090'
const server = app.listen(httpServerPort, () => {
  console.log('server listening on port', httpServerPort)
})

io.attach(server)
io.use((socket, next) => {
  // Wrap the sessionMiddleware to get the user id
  sessionMiddleware(socket.request, {}, next)
})

require('./job/jobManager').init(io)
