require('dotenv').config()

const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const compression = require('compression')
const cookieParser = require('cookie-parser')

const sessionMiddleware = require('./config/sessionMiddleware')
const headerMiddleware = require('./config/headerMiddleware')
const accessControlMiddleware = require('./config/accessControlMiddleware')
const authConfig = require('./config/authConfig')
// const loginHandler = require('./auth/loginHandler')
// const authenticator = require('./auth/authenticator')
// const apiRouter = require('./api/apiRouter')

// run database migrations
require('./db/migration/execMigrations')()

const app = express()

// app initializations
app.use(bodyParser.json({limit: '5000kb'}))
app.use(cookieParser())
headerMiddleware.init(app)
sessionMiddleware.init(app)
accessControlMiddleware.init(app)
authConfig.init(app)
// authenticator.init(app)
// loginHandler.init(app)

app.use(compression({threshold: 512}))

app.use('/', express.static(`${__dirname}/../dist`))
app.use('/app/*', express.static(`${__dirname}/../dist`))

app.use('/img/', express.static(`${__dirname}/../web-resources/img`))
app.use('/css/', express.static(`${__dirname}/../web-resources/css`))

// initializing api router
// app.use('/api', apiRouter.router)

const httpServerPort = process.env.PORT || '9090'
app.listen(httpServerPort, () => {
  console.log('server listening on port', httpServerPort)
})