const express = require('express')
const morgan = require('morgan')

const { PORT } = require('./config')

const { Instance, Timer, Proxy } = require('./domain')

// Create Express Server
const app = express()

app.use(morgan('dev'))

app.use('', Instance.Service.getInstanceMiddleware, Timer.Service.timersMiddleware, Proxy.Service.proxyMiddleware)

// Start the Proxy
app.listen(PORT, () => {
  console.log(`Starting Proxy at: ${PORT}`)
})
