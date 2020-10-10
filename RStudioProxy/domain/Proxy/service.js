const { createProxyMiddleware } = require('http-proxy-middleware')
const ProxyModel = require('./model')

const proxyMiddleware = createProxyMiddleware(ProxyModel.proxyConfig)

module.exports = {
  proxyMiddleware,
}
