const { MIN_FREE_INSTANCES, MAX_INSTANCES } = require('../../../config')
const { Instance } = require('../../domain')

const { Model: InstanceModel, Manager: InstanceManager } = Instance

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

  const userInstance = await InstanceManager.getInstanceByUserId({ userId })
  if (userInstance) {
    return generateResponse(userInstance)
  }

  let assignedInstance = false
  let remainFreeInstances = 0
  const freeInstances = await InstanceManager.getFreeInstances()
  const currentInstances = await InstanceManager.getInstances()
  let currentNumberOfInstances = (currentInstances || []).length

  if (freeInstances.length > 0) {
    const [freeInstance, ...remainFreeInstancesList] = freeInstances
    assignedInstance = freeInstance
    remainFreeInstances = remainFreeInstancesList.length
  } else if (currentNumberOfInstances < MAX_INSTANCES) {
    assignedInstance = await InstanceManager.createNewInstance({ userId })
    currentNumberOfInstances += 1
  }

  if (remainFreeInstances < MIN_FREE_INSTANCES) {
    let instancesToCreate = MIN_FREE_INSTANCES - remainFreeInstances

    instancesToCreate = Math.min(instancesToCreate, MAX_INSTANCES - currentNumberOfInstances)
    await Promise.all(
      new Array(instancesToCreate > 0 ? instancesToCreate : 0)
        .fill('.')
        .map(async () => InstanceManager.createNewInstance())
    )
  }

  if (assignedInstance) {
    assignedInstance = InstanceModel.setUserId({ userId })(assignedInstance)
    await InstanceManager.assignInstance({ instance: assignedInstance, userId })

    return generateResponse(assignedInstance)
  }
  const response = {
    statusCode: 400,
    body: JSON.stringify({ error: 'There are not free RStudio servers, try later.' }),
  }
  return response
}

module.exports = requestInstance
