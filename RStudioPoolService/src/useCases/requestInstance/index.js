const { Instance } = require('../../domain')

const { Model: InstanceModel, Manager: InstanceManager } = Instance

const MIN_FREE_INSTANCES = 1

/*
PUT/POST
body { data: userId }
*/

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
  let assignedInstance = false

  const userInstance = await InstanceManager.getUserInstance({ userId })
  if (userInstance) {
    console.log('userInstance', userInstance)
    return generateResponse(userInstance)
  }

  const freeInstances = await InstanceManager.getFreeInstances()
  console.log('freeInstances', freeInstances)
  if (freeInstances.length > 0) {
    const [freeInstance, ...remainFreeInstances] = freeInstances
    assignedInstance = freeInstance

    if (remainFreeInstances.length < MIN_FREE_INSTANCES) {
      await InstanceManager.createNewInstance({ userId })
    }
  } else {
    assignedInstance = await InstanceManager.createNewInstance({ userId })
    console.log('assignedInstance', assignedInstance)
  }

  assignedInstance = InstanceModel.setUserId({ userId })(assignedInstance)
  await InstanceManager.assignInstance({ instance: assignedInstance, userId })

  return generateResponse(assignedInstance)
}

module.exports = requestInstance
