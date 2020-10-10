const { commands } = require('../../infrastructure')

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

const isAssigned = (instance) => !!instance.userId

module.exports = {
  getInstance,
  getInstancesIds,
  killInstance,
  getInstanceIdByReferer,
  isAssigned,
}
