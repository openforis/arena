const { Instance } = require('../../domain')

const { Manager: InstanceManager } = Instance

/*
  GET /
  GET /:id
*/
const checkStatus = async ({ instanceId = false } = {}) => {
  let responseData = {}
  console.log("check status", instanceId)
  if (instanceId) {
    responseData = await InstanceManager.getInstance({ instanceId })
  } else {
    responseData = await InstanceManager.getInstances({ instanceId })
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(responseData),
  }
  return response
}

module.exports = checkStatus
