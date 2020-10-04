const { Instance } = require('../../domain')

const { Model: InstanceModel, Manager: InstanceManager } = Instance

const MIN_FREE_INSTANCES = 1

const generateResponse = (instance) => {
  const instanceId = InstanceModel.getId(instance)
  const response = {
    statusCode: 200,
    body: JSON.stringify({ instanceId }),
  }
  return response
}

const requestInstance = async ({ userId = false } = {}) => {
  if (!userId) {
    const response = {
      statusCode: 403,
      body: JSON.stringify({}),
    }
    return response
  }

  const userInstance = await InstanceManager.getUserInstance({ userId })
  if (userInstance) {
    return generateResponse(userInstance)
  }

  let assignedInstance = false
  let remainFreeInstances = 0
  const freeInstances = await InstanceManager.getFreeInstances()

  if (freeInstances.length > 0) {
    const [freeInstance, ...remainFreeInstancesList] = freeInstances
    assignedInstance = freeInstance
    remainFreeInstances = remainFreeInstancesList.length
  } else {
    assignedInstance = await InstanceManager.createNewInstance({ userId })
  }

  if (remainFreeInstances < MIN_FREE_INSTANCES) {
    await InstanceManager.createNewInstance()
  }

  assignedInstance = InstanceModel.setUserId({ userId })(assignedInstance)
  await InstanceManager.assignInstance({ instance: assignedInstance, userId })

  return generateResponse(assignedInstance)
}

module.exports = requestInstance
