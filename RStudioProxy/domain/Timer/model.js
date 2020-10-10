const { TIMEOUT_INSTANCE } = require('../../config')
const Instance = require('../Instance')

const timeoutsMap = {}
let timersInitialized = false

const setTimer = async ({ instanceId }) =>
  new Promise((resolve) => {
    clearTimeout(timeoutsMap[instanceId])

    const timer = setTimeout(async () => Instance.Model.killInstance({ instanceId }), TIMEOUT_INSTANCE)

    timeoutsMap[instanceId] = timer
    resolve()
  })

const initTimers = async () => {
  const instancesIds = await Instance.Model.getInstancesIds()
  await Promise.all(
    (instancesIds || []).filter(Instance.Model.isAssigned).map(async (instanceId) => {
      return setTimer({ instanceId })
    })
  )
  timersInitialized = true
  return timersInitialized
}

const areTimersInitialized = () => timersInitialized

module.exports = {
  initTimers,
  setTimer,
  areTimersInitialized,
}
