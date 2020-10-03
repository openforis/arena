const { redis, awsEc2 } = require('../../infrastructure')
const { Model: InstanceModel } = require('./model')

const getInstancesKeys = async () => redis.keys()
const getInstance = async ({ instanceId }) => {
  const instance = await redis.get(instanceId)
  if (instance) {
    return JSON.parse(instance)
  }
  return false
}

const getInstances = async () => {
  const instancesKeys = await getInstancesKeys()
  const instances = await Promise.all((instancesKeys || []).map(async (instanceId) => getInstance({ instanceId })))
  return instances
}

const getFreeInstances = async () => {
  const instances = await getInstances()
  return (instances || []).filter(InstanceModel.isFree)
}

const saveInstance = async (instance) => redis.set(InstanceModel.getId(instance), JSON.parse(instance))

const createNewInstance = async (newInstanceConfig = InstanceModel.getNewInstanceConfig()) => {
  const createdInstance = await awsEc2.createInstance(newInstanceConfig)
  return InstanceModel.parsedInstanceFrom({
    instance: createdInstance,
    from: 'AWS',
  })
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
