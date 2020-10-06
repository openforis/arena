const { TIMEOUT_RSTUDIO } = require('../config')
const { getInstances, killInstance } = require('./instance')

const timeoutsMap = {}
let areTimersInitialized = false

const setTimer = async ({ userId }) =>
  new Promise((resolve) => {
    clearTimeout(timeoutsMap[userId])

    const timer = setTimeout(async () => killInstance({ userId }), TIMEOUT_RSTUDIO)

    timeoutsMap[userId] = timer
    resolve()
  })

const isAssigned = (instance) => !!instance.userId
const initTimers = async () => {
  const instances = await getInstances()
  return Promise.all(
    (instances || []).filter(isAssigned).map(async (instance) => {
      const { userId } = instance
      return setTimer({ userId })
    })
  )
}

const timeoutMiddleware = async (req, res, next) => {
  const { instanceId } = req
  const userId = instanceId
  if (!areTimersInitialized) {
    await initTimers()
    areTimersInitialized = true
  }

  if (userId) {
    await setTimer({ userId })
  }

  next()
}

module.exports = {
  timeoutMiddleware,
}
