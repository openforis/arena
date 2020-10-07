const { Instance } = require('../../domain')

const { Manager: InstanceManager, Model: InstanceModel } = Instance

const checkStatus = async ({ instanceId } = {}) => {
  let responseData = {}
  if (instanceId) {
    const instance = await InstanceManager.getInstanceById({ instanceId })
    responseData = { instance }
  } else {
    let instances = await InstanceManager.getInstances()
    instances = instances.filter((instance) => !!InstanceModel.getUserId(instance)).map(InstanceModel.getId)

    responseData = { instances }
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(responseData),
  }

  return response
}

module.exports = checkStatus
