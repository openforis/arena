const { commands } = require('../infrastructure')

const FIELD_TO_IDENTIFY_INSTANCE = 'instanceId'

const getInstances = async () => {
  const { data } = await commands.sendCommand({ command: commands.instanceCommands.getStatus() })
  const { instances } = data
  return instances
}

const killInstance = async ({ instanceId }) =>
  commands.sendCommand({ command: commands.instanceCommands.delete({ instanceId }) })

const getInstancesIds = ({ instances }) =>
  instances
    .filter((instance) => !!instance[FIELD_TO_IDENTIFY_INSTANCE])
    .map((instance) => instance[FIELD_TO_IDENTIFY_INSTANCE])

const getInstancesById = ({ instances }) =>
  instances.reduce((acc, instance) => ({ ...acc, [instance[FIELD_TO_IDENTIFY_INSTANCE]]: { ...instance } }), {})

const getInstanceIdByReferer = ({ instances, referer }) =>
  instances.find((instanceKey) => {
    const regex = new RegExp(`${instanceKey}$`)
    return regex.test(referer)
  })

const getInstanceMiddleware = async (req, res, next) => {
  const instances = await getInstances()
  const instancesIds = getInstancesIds({ instances })
  const instancesById = getInstancesById({ instances })

  let instanceId = false

  if (instancesIds.includes(req.originalUrl.replace('/', ''))) {
    instanceId = req.originalUrl.replace('/', '')
  }

  const instanceIdOnReferer = req.headers.referer
    ? getInstanceIdByReferer({
        instances: instancesIds,
        referer: req.headers.referer,
      })
    : false
  if (instanceIdOnReferer) {
    instanceId = instanceIdOnReferer
  }

  let instance = false

  if (instanceId) {
    instance = instancesById[instanceId]
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
  killInstance,
}
