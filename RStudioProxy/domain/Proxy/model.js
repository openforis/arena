const { DEFAULT_URL, ROUTE_TO_REPLACE, STRING_TO_REPLACE } = require('../../config')

const customRouter = (req) => {
  const { instanceId, instance } = req
  let route = DEFAULT_URL
  if (instanceId && instance) {
    const instanceUrl = instance.url
    route = ROUTE_TO_REPLACE.replace(STRING_TO_REPLACE, instanceUrl)
  }
  return route
}

const rewriteFn = (path, req) => {
  const { instanceId } = req
  return (path || '').replace(instanceId, '')
}

const proxyConfig = {
  target: DEFAULT_URL,
  router: customRouter,
  changeOrigin: true,
  pathRewrite: rewriteFn,
}

module.exports = {
  proxyConfig,
}
