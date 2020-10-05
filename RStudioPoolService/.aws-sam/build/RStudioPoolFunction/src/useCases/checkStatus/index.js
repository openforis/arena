const { Instance } = require('../../domain')

const { Manager: InstanceManager } = Instance

const checkStatus = async ({ userId } = {}) => {
  const instance = await InstanceManager.getInstanceByUserId({ userId })

  let response = {}
  if (!instance) {
    response = {
      statusCode: 400,
      body: JSON.stringify({}),
    }
  } else {
    response = {
      statusCode: 200,
      body: JSON.stringify({ instance }),
    }
  }
  return response
}

module.exports = checkStatus
