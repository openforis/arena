require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const compression = require('compression')
const cookieParser = require('cookie-parser')

const sessionMiddleware = require('./config/sessionMiddleware')
const headerMiddleware = require('./config/headerMiddleware')
const accessControlMiddleware = require('./config/accessControlMiddleware')
const authConfig = require('./auth/authConfig')
// const apiRouter = require('./api/apiRouter')
const authApi = require('./auth/authApi')

// run database migrations
require('./db/migration/execMigrations')()

const app = express()

// app initializations
app.use(bodyParser.json({limit: '5000kb'}))
app.use(cookieParser())
headerMiddleware.init(app)
sessionMiddleware.init(app)
authConfig.init(app)
//accesscontrolmiddleware must be initialized after authConfig
accessControlMiddleware.init(app)

app.use(compression({threshold: 512}))

app.use('/', express.static(`${__dirname}/../dist`))
app.use('/app*', express.static(`${__dirname}/../dist`))

app.use('/img/', express.static(`${__dirname}/../web-resources/img`))
app.use('/css/', express.static(`${__dirname}/../web-resources/css`))

//apis
authApi.init(app)
// initializing api router
// app.use('/api', apiRouter.router)

const httpServerPort = process.env.PORT || '9090'
app.listen(httpServerPort, () => {
  console.log('server listening on port', httpServerPort)
})