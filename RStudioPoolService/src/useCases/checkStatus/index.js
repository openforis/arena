const { Instance } = require('../../domain')

const { Manager: InstanceManager } = Instance

/*
  GET /
  GET /:id
*/
const checkStatus = async ({ instanceId = false } = {}) => {
  let responseData = {}
  if (instanceId) {
    responseData = InstanceManager.getInstance({ instanceId })
  } else {
    responseData = InstanceManager.getInstances({ instanceId })
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(responseData),
  }
  return response
}

module.exports = checkStatus
