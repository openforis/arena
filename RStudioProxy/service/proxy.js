const { DEFAULT_URL, ROUTE_TO_REPLACE } = require('../config')

const customRouter = (req) => {
  const { instanceId, instance } = req
  let route = DEFAULT_URL
  if (instanceId && instance) {
    const instanceUrl = instance.url
    route = ROUTE_TO_REPLACE.replace('REPLACE_ME', instanceUrl)
  }
  return route
}

const rewriteFn = (path, req) => {
  const { instanceId } = req
  return (path || '').replace(instanceId, '')
}

const config = {
  target: DEFAULT_URL,
  router: customRouter,
  changeOrigin: true,
  pathRewrite: rewriteFn,
}

module.exports = {
  config,
}
