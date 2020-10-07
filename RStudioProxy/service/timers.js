const { TIMEOUT_INSTANCE } = require('../config')
const { getInstancesIds, killInstance } = require('./instance')

const timeoutsMap = {}
let areTimersInitialized = false

const setTimer = async ({ instanceId }) =>
  new Promise((resolve) => {
    clearTimeout(timeoutsMap[instanceId])

    const timer = setTimeout(async () => killInstance({ instanceId }), TIMEOUT_INSTANCE)

    timeoutsMap[instanceId] = timer
    resolve()
  })

const isAssigned = (instance) => !!instance.userId

const initTimers = async () => {
  const instancesIds = await getInstancesIds()
  return Promise.all(
    (instancesIds || []).filter(isAssigned).map(async (instanceId) => {
      return setTimer({ instanceId })
    })
  )
}

const timeoutMiddleware = async (req, res, next) => {
  const { instanceId } = req
  if (!areTimersInitialized) {
    await initTimers()
    areTimersInitialized = true
  }

  if (instanceId) {
    await setTimer({ instanceId })
  }

  next()
}

module.exports = {
  timeoutMiddleware,
}
