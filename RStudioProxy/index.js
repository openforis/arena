const express = require('express')
const morgan = require('morgan')

const { createProxyMiddleware } = require('http-proxy-middleware')

const { PORT, HOST } = require('./config')

const { instance, proxy, timers } = require('./service')

// Create Express Server
const app = express()

app.use(morgan('dev'))

app.use('', instance.getInstanceMiddleware, timers.timeoutMiddleware, createProxyMiddleware(proxy.config))

// Start the Proxy
app.listen(PORT, HOST, () => {
  console.log(`Starting Proxy at ${HOST}:${PORT}`)
})
