const { awsEc2 } = require('../../infrastructure')
const InstanceModel = require('./model')

const getInstances = async () => {
  const instancesAws = await awsEc2.getInstances({ filters: InstanceModel.getFilters() })
  const instances = (instancesAws || []).map((instance) => InstanceModel.parsedInstanceFrom({ instance }))
  return instances
}

const getFreeInstances = async () => {
  const instances = await getInstances()
  return (instances || []).filter(InstanceModel.isFree)
}

const getInstanceByUserId = async ({ userId = false } = {}) => {
  if (!userId) return false
  const instances = await getInstances()
  const userInstance = instances.find((instance) => InstanceModel.getUserId(instance) === userId)
  return userInstance
}

const getInstanceById = async ({ instanceId = false } = {}) => {
  if (!instanceId) return false
  const instances = await getInstances()
  const instanceById = instances.find((instance) => InstanceModel.getId(instance) === instanceId)
  return instanceById
}

const createNewInstance = async ({ userId = false } = {}) => {
  const newInstanceConfig = InstanceModel.getNewInstanceConfig({ userId })
  const createdInstance = await awsEc2.createInstance(newInstanceConfig)

  const instance = InstanceModel.parsedInstanceFrom({ instance: createdInstance })
  return instance
}

const terminateInstance = async ({ instanceId }) => {
  const instance = await getInstanceById({ instanceId })
  if (!instance) return
  await awsEc2.terminateInstance({ instanceId })
}

const assignInstance = async ({ instance, userId }) => {
  const instanceId = InstanceModel.getId(instance)
  await awsEc2.assignTagsToInstance({ instanceId, tags: InstanceModel.getInstanceTags({ userId }) })
}

const InstanceManager = {
  getInstanceByUserId,
  getInstanceById,
  getInstances,
  getFreeInstances,
  assignInstance,
  createNewInstance,
  terminateInstance,
}

module.exports = InstanceManager
