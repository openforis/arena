const { TIMEOUT_INSTANCE } = require('../config')
const { getInstances, killInstance } = require('./instance')

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
  const instances = await getInstances()
  return Promise.all(
    (instances || []).filter(isAssigned).map(async (instance) => {
      const { instanceId } = instance
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
