const { redis, awsEc2 } = require('../../infrastructure')
const InstanceModel = require('./model')

const getInstancesKeys = async () => redis.keys()
const getInstance = async ({ instanceId }) => {
  console.log("getInstance", instanceId)
  const instance = await redis.get(instanceId)
  console.log("getInstance", instance)
  if (instance) {
    return JSON.parse(instance)
  }
  return false
}

const getInstances = async () => {
  const instancesKeys = await getInstancesKeys()
  console.log("instancesKeys", instancesKeys)
  const instances = await Promise.all((instancesKeys || []).map(async (instanceId) => getInstance({ instanceId })))
  return instances
}

const getFreeInstances = async () => {
  const instances = await getInstances()
  console.log("instances", instances)
  return (instances || []).filter(InstanceModel.isFree)
}

const saveInstance = async (instance) => {
  console.log('SAVE', InstanceModel.getId(instance), JSON.stringify(instance))
  await redis.set(InstanceModel.getId(instance), JSON.stringify(instance))
}

const createNewInstance = async (newInstanceConfig = InstanceModel.getNewInstanceConfig()) => {
  const createdInstance = await awsEc2.createInstance(newInstanceConfig)

  const instance = InstanceModel.parsedInstanceFrom({
    instance: createdInstance,
    from: 'AWS',
  })
  console.log('createdInstance', instance)
  saveInstance(instance)
  return instance
}

const terminateInstance = async ({ instanceId }) => {
  await awsEc2.terminateInstance({ instanceId })
  await redis.remove(instanceId)
}

const InstanceManager = {
  getInstancesKeys,
  getInstance,
  getInstances,
  getFreeInstances,
  saveInstance,
  createNewInstance,
  terminateInstance,
}

module.exports = InstanceManager
