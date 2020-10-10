const InstanceModel = require('./model')

const getInstanceMiddleware = async (req, res, next) => {
  const instancesIds = await InstanceModel.getInstancesIds()

  let instanceId = false

  if (instancesIds.includes(req.originalUrl.replace('/', ''))) {
    instanceId = req.originalUrl.replace('/', '')
  }

  const instanceIdOnReferer = req.headers.referer
    ? InstanceModel.getInstanceIdByReferer({
        instancesIds,
        referer: req.headers.referer,
      })
    : false
  if (instanceIdOnReferer) {
    instanceId = instanceIdOnReferer
  }

  let instance = false

  if (instanceId) {
    instance = await InstanceModel.getInstance({ instanceId })
  }

  if (instanceId && instance) {
    req.instance = instance
    req.instanceId = instanceId
  }
  next()
}

module.exports = {
  getInstanceMiddleware,
}
