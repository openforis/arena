const { IMAGE_ID, IMAGE_TYPE, REGION, ACCOUNT, SECURITY_GROUP, INSTANCE_PROFILE, KEY_NAME } = require('../../../config')

const getId = (instance) => instance.instanceId
const getUrl = (instance) => instance.url
const getUserId = (instance) => instance.userId || false

const isFree = (instance) => !getUserId(instance)

const setUserId = ({ userId }) => (instance) => ({ ...instance, userId })

const parsedInstanceFrom = ({ instance }) => {
  const { InstanceId, PublicDnsName, KeyName, Tags } = instance
  return {
    instanceId: InstanceId,
    url: PublicDnsName,
    keyName: KeyName,
    ...(Tags || []).reduce((tags, tag) => ({ ...tags, [tag.Key]: tag.Value }), {}),
  }
}

const getInstanceTags = ({ userId }) => [
  {
    Key: 'Purpose',
    Value: 'RStudio',
  },
  ...(userId
    ? [
        {
          Key: 'userId',
          Value: userId,
        },
      ]
    : []),
]

const getFilters = () => [
  { Name: 'tag:Purpose', Values: ['RStudio'] },
  {
    Name: 'instance-state-name',
    Values: ['pending', 'running'],
  },
]

const getNewInstanceConfig = ({ userId = false } = {}) => ({
  ImageId: IMAGE_ID, // this iam can be found right to the name of the instance when a new instance is launched by hand, this id is unique by region
  InstanceType: IMAGE_TYPE, // size of the instance
  KeyName: KEY_NAME,
  MaxCount: 1,
  MinCount: 1,
  SecurityGroupIds: [SECURITY_GROUP],
  IamInstanceProfile: {
    Name: INSTANCE_PROFILE,
  },
  UserData: `#!/bin/bash
    sudo mkdir /home/ubuntu/docker-runner
    cd /home/ubuntu/docker-runner
    sudo chown -R $USER:$USER /home/ubuntu/docker-runner
    sudo apt-get update
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo service docker start
    sudo chmod 666 /var/run/docker.sock
    sudo apt install awscli -y
    aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT}
    docker pull ${ACCOUNT}/rstudio
    sudo docker run -d -p 8787:8787 -e DISABLE_AUTH=true ${ACCOUNT}/rstudio
 `,
  TagSpecifications: [
    {
      ResourceType: 'instance',
      Tags: [...getInstanceTags({ userId })],
    },
  ],
})

const Instance = {
  getId,
  getUrl,
  getUserId,
  isFree,
  setUserId,
  parsedInstanceFrom,
  getNewInstanceConfig,
  getInstanceTags,
  getFilters,
}

module.exports = Instance
