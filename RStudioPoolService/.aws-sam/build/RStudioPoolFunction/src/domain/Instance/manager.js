const { awsEc2 } = require('../../infrastructure')
const InstanceModel = require('./model')

const getInstances = async () => {
  const instancesAws = await awsEc2.getInstances()
  const instances = (instancesAws || []).map((instance) => InstanceModel.parsedInstanceFrom({ instance }))
  return instances
}
const getInstanceByUserId = async ({ userId }) => {
  const instances = await getInstances()
  const instanceByUserId = instances.find((instance) => InstanceModel.getUserId(instance) === userId)
  return instanceByUserId
}

const getFreeInstances = async () => {
  const instances = await getInstances()
  return (instances || []).filter(InstanceModel.isFree)
}

const getUserInstance = async ({ userId = false } = {}) => {
  if (!userId) return false
  const instances = await getInstances()
  const userInstance = instances.find((instance) => InstanceModel.getUserId(instance) === userId)
  return userInstance
}

const createNewInstance = async ({ userId = false } = {}) => {
  const newInstanceConfig = InstanceModel.getNewInstanceConfig({ userId })
  const createdInstance = await awsEc2.createInstance(newInstanceConfig)

  const instance = InstanceModel.parsedInstanceFrom({
    instance: createdInstance,
    from: 'AWS',
  })
  return instance
}

const terminateInstance = async ({ userId }) => {
  const instance = await getInstanceByUserId({ userId })
  if (!instance) return
  const instanceId = InstanceModel.getId(instance)
  await awsEc2.terminateInstance({ instanceId })
}

const assignInstance = async ({ instance, userId }) => {
  const instanceId = InstanceModel.getId(instance)
  await awsEc2.assignInstance({ instanceId, userId })
}

const InstanceManager = {
  getInstanceByUserId,
  getInstances,
  getFreeInstances,
  getUserInstance,
  assignInstance,
  createNewInstance,
  terminateInstance,
}

module.exports = InstanceManager
