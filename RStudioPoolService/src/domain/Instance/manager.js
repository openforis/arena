const { redis, awsEc2 } = require('../../infrastructure')
const InstanceModel = require('./model')

const getInstancesKeys = async () => redis.keys()
const getInstance = async ({ instanceId }) => {
  console.log('getInstance', instanceId)
  const instance = await redis.get(instanceId)
  console.log('getInstance', instance)
  if (instance) {
    return JSON.parse(instance)
  }
  return false
}

const getInstances = async () => {
  /*const instancesKeys = await getInstancesKeys()
  const instancesAws = ((await awsEc2.getInstances()) || []).map((instance) =>
    InstanceModel.parsedInstanceFrom({ instance })
  )
  console.log('instancesKeys', instancesKeys)
  console.log('instancesUp', instancesAws)
  const instances = await Promise.all((instancesKeys || []).map(async (instanceId) => getInstance({ instanceId })))
  return instances*/

  const instancesAws = await awsEc2.getInstances()
  const instances = (instancesAws || []).map((instance) => InstanceModel.parsedInstanceFrom({ instance }))
  return instances
}

const getFreeInstances = async () => {
  const instances = await getInstances()
  console.log('instances', instances)
  return (instances || []).filter(InstanceModel.isFree)
}

const getUserInstance = async ({ userId = false } = {}) => {
  const instances = await getInstances()
  const userInstance = instances.find((instance) => InstanceModel.getUserId(instance) === userId)
  return userInstance
}

const saveInstance = async (instance) => redis.set(InstanceModel.getId(instance), JSON.stringify(instance))

const createNewInstance = async ({ userId = false } = {}) => {
  const newInstanceConfig = InstanceModel.getNewInstanceConfig({ userId })
  console.log('newInstanceConfig', newInstanceConfig)
  const createdInstance = await awsEc2.createInstance(newInstanceConfig)

  const instance = InstanceModel.parsedInstanceFrom({
    instance: createdInstance,
    from: 'AWS',
  })
  console.log('createdInstance', instance)
  //await saveInstance(instance)
  return instance
}

const terminateInstance = async ({ instanceId }) => {
  await awsEc2.terminateInstance({ instanceId })
  await redis.remove(instanceId)
}

const assignInstance = async ({ instance, userId }) => {
  const instanceId = InstanceModel.getId(instance)
  await awsEc2.assignInstance({ instanceId, userId })
}

const InstanceManager = {
  getInstancesKeys,
  getInstance,
  getInstances,
  getFreeInstances,
  getUserInstance,
  saveInstance,
  assignInstance,
  createNewInstance,
  terminateInstance,
}

module.exports = InstanceManager
