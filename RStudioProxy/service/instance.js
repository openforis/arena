const { redis } = require('../infrastructure')
const axios = require('axios')

const getInstancesKeys = async () => {
  const instances = await axios.post('https://808vq2o8gk.execute-api.eu-central-1.amazonaws.com/Prod/', {
    command: 'GET_STATUS'
  })
  console.log(instances)
}

const getInstanceIdByReferer = ({ instances, referer }) =>
  instances.find((instanceKey) => {
    const regex = new RegExp(`${instanceKey}$`)
    return regex.test(referer)
  })

const getInstanceMiddleware = async (req, res, next) => {
  const ins = await getInstancesKeys()
  console.log(ins)
  const instances = await redis.keys()
  let instanceId = false

  if (instances.includes(req.originalUrl)) {
    instanceId = req.originalUrl
  }
  const instanceIdOnReferer = req.headers.referer
    ? getInstanceIdByReferer({
        instances,
        referer: req.headers.referer,
      })
    : false
  if (instanceIdOnReferer) {
    instanceId = instanceIdOnReferer
  }

  let instance = false

  if (instanceId) {
    instance = await redis.get(instanceId)
  }

  if (instanceId && instance) {
    req.instance = instance
    req.instanceId = instanceId
  }
  next()
}

module.exports = {
  getInstanceMiddleware,
}
