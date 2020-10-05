const { Instance } = require('../../domain')

const { Manager: InstanceManager } = Instance

const checkStatus = async ({ userId } = {}) => {
  let responseData = {}
  if (userId) {
    const instance = await InstanceManager.getInstanceByUserId({ userId })
    responseData = { instance }
  } else {
    const instances = await InstanceManager.getInstances()
    responseData = { instances }
  }

  response = {
    statusCode: 200,
    body: JSON.stringify(responseData),
  }

  return response
}

module.exports = checkStatus
