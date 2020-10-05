const { commands } = require('../infrastructure')

const getInstances = async () => {
  const { data } = await commands.sendCommand({ command: commands.instanceCommands.getStatus() })
  const { instances } = data
  return instances
}

const killInstance = async ({ userId }) =>
  commands.sendCommand({ command: commands.instanceCommands.delete({ userId }) })

const getInstancesUserIds = ({ instances }) => {
  const instancesUserIds = instances.filter((instance) => !!instance.userId).map((instance) => instance.userId)
  return instancesUserIds
}

const getInstancesByUserId = ({ instances }) => {
  return instances.reduce((acc, instance) => ({ ...acc, [instance.userId]: { ...instance } }), {})
}

const getInstanceIdByReferer = ({ instances, referer }) =>
  instances.find((instanceKey) => {
    const regex = new RegExp(`${instanceKey}$`)
    return regex.test(referer)
  })

const getInstanceMiddleware = async (req, res, next) => {
  const instances = await getInstances()
  const instancesUserIds = getInstancesUserIds({ instances })
  const instancesByUserId = getInstancesByUserId({ instances })

  let instanceId = false

  if (instancesUserIds.includes(req.originalUrl.replace('/', ''))) {
    instanceId = req.originalUrl.replace('/', '')
  }

  const instanceIdOnReferer = req.headers.referer
    ? getInstanceIdByReferer({
        instances: instancesUserIds,
        referer: req.headers.referer,
      })
    : false
  if (instanceIdOnReferer) {
    instanceId = instanceIdOnReferer
  }

  let instance = false

  if (instanceId) {
    instance = instancesByUserId[instanceId]
  }

  if (instanceId && instance) {
    req.instance = instance
    req.instanceId = instanceId
  }
  next()
}

module.exports = {
  getInstanceMiddleware,
  getInstances,
  getInstancesUserIds,
  killInstance,
}
