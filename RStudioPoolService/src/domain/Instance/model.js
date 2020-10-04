const REGION = 'eu-central-1'
const ACCOUNT = '407725983764.dkr.ecr.eu-central-1.amazonaws.com'
const SECURTY_GROUP = 'sg-0718fb65b156ac691'
const INSTANCE_PROFILE = 'ec2-admin'
const KEY_NAME = 'LambdaInstance'

const getId = (instance) => instance.instanceId
const getUrl = (instance) => instance.url
const getUserId = (instance) => instance.userId

const isFree = (instance) => !getUserId(instance)

const setUserId = ({ userId }) => (instance) => ({ ...instance, userId })

const parsedInstanceFrom = ({ instance, from }) => {
  const { InstanceId, PublicDnsName, KeyName, Tags } = instance
  return {
    instanceId: InstanceId,
    url: PublicDnsName,
    keyName: KeyName,
    ...(Tags || []).reduce((tags, tag) => ({ ...tags, [tag.Key]: tag.Value }), {}),
  }
}

const getNewInstanceConfig = ({ userId = false } = {}) => ({
  ImageId: 'ami-0130bec6e5047f596', // this iam can be found right to the name of the instance when a new instance is launched by hand, this id is unique by region
  InstanceType: 't2.micro', // size of the instance
  KeyName: KEY_NAME,
  MaxCount: 1,
  MinCount: 1,
  SecurityGroupIds: [SECURTY_GROUP], // security group created on step 3
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
})

const Instance = {
  getId,
  getUrl,
  getUserId,
  isFree,
  setUserId,
  parsedInstanceFrom,
  getNewInstanceConfig,
}

module.exports = Instance
