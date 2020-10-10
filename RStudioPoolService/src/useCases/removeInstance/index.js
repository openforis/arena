const { Instance } = require('../../domain')

const { Manager: InstanceManager } = Instance

const removeInstance = async ({ instanceId }) => {
  await InstanceManager.terminateInstance({ instanceId })

  const response = {
    statusCode: 200,
    body: JSON.stringify({ status: 'OK' }),
  }
  return response
}

module.exports = removeInstance
