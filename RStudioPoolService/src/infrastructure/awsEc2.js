const EC2 = require('aws-sdk/clients/ec2')

const createInstance = async (newInstanceConfig) => {
  const ec2 = new EC2()
  const params = {
    ...newInstanceConfig,
    UserData: new Buffer.from(newInstanceConfig.UserData).toString('base64'),
  }

  // function to create this new instance
  const instance = await ec2.runInstances(params).promise()
  const instanceCreated = instance.Instances[0]
  console.log('instanceCreated', instanceCreated)
  return instanceCreated
}

const terminateInstance = async ({ instanceId }) => {
  const ec2 = new EC2()
  return ec2.terminateInstances({ InstanceIds: [instanceId] }).promise()
}

const getInstances = async () => {
  const ec2 = new EC2()
  const params = {
    Filters: [
      { Name: 'tag:Purpose', Values: ['RStudio'] },
      {
        Name: 'instance-state-name',
        Values: ['pending', 'running'],
      },
    ],
  }
  console.log('params', params)
  const reservations = await ec2.describeInstances(params).promise()
  console.log('reservations', reservations)
  const { Reservations } = reservations
  const instances = Reservations.reduce((acc, reservation) => [...acc, ...(reservation.Instances || [])], [])

  return instances
}

const assignInstance = async ({ instanceId, userId }) => {
  const ec2 = new EC2()
  const params = {
    Resources: [instanceId],
    Tags: [
      {
        Key: 'Purpose',
        Value: 'RStudio',
      },
      {
        Key: 'userId',
        Value: userId || 'FREE',
      },
    ],
  }
  await ec2.createTags(params).promise()
}

module.exports = {
  getInstances,
  createInstance,
  terminateInstance,
  assignInstance,
}
