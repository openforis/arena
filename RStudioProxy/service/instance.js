const { commands } = require('../infrastructure')

const getInstance = async ({ instanceId }) => {
  const { data } = await commands.sendCommand({ command: commands.instanceCommands.getInstanceStatus({ instanceId }) })
  const { instance } = data
  return instance
}

const getInstancesIds = async () => {
  const { data } = await commands.sendCommand({ command: commands.instanceCommands.getStatus() })
  const { instances } = data
  return instances
}

const killInstance = async ({ instanceId }) =>
  commands.sendCommand({ command: commands.instanceCommands.delete({ instanceId }) })

const getInstanceIdByReferer = ({ instancesIds, referer }) =>
  instancesIds.find((instanceKey) => {
    const regex = new RegExp(`${instanceKey}$`)
    return regex.test(referer)
  })

const getInstanceMiddleware = async (req, res, next) => {
  const instancesIds = await getInstancesIds()

  let instanceId = false

  if (instancesIds.includes(req.originalUrl.replace('/', ''))) {
    instanceId = req.originalUrl.replace('/', '')
  }

  const instanceIdOnReferer = req.headers.referer
    ? getInstanceIdByReferer({
        instancesIds,
        referer: req.headers.referer,
      })
    : false
  if (instanceIdOnReferer) {
    instanceId = instanceIdOnReferer
  }

  let instance = false

  if (instanceId) {
    instance = await getInstance({ instanceId })
  }

  if (instanceId && instance) {
    req.instance = instance
    req.instanceId = instanceId
  }
  next()
}

module.exports = {
  getInstanceMiddleware,
  getInstancesIds,
  killInstance,
}
