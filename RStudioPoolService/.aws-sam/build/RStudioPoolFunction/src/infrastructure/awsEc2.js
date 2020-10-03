const EC2 = require('aws-sdk/clients/ec2')

const createInstance = async (newInstanceConfig) => {
  const ec2 = new EC2()

  const params = {
    ...newInstanceConfig,
    UserData: new Buffer.from(newInstanceConfig.UserData).toString('base64'),
  }

  // function to create this new instance
  const instance = await ec2.runInstances(params).promise()

  return instance
}

const terminateInstance = async ({ instanceId }) => {
  const ec2 = new EC2()
  return ec2.terminateInstances({ InstanceIds: [instanceId] })
}

module.exports = {
  createInstance,
  terminateInstance,
}
