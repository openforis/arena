const { Instance } = require('../../domain')

const { Manager: InstanceManager } = Instance

/*
  DELETE
  body: { instanceId: 'XXXX' }
*/

const removeInstance = async ({ userId }) => {

  await InstanceManager.terminateInstance({ userId })

  const response = {
    statusCode: 200,
    body: JSON.stringify({ status: 'OK' }),
  }
  return response
}

module.exports = removeInstance
