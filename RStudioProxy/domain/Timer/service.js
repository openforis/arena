const TimerModel = require('./model')

const timersMiddleware = async (req, res, next) => {
  const { instanceId } = req
  if (!TimerModel.areTimersInitialized()) {
    await TimerModel.initTimers()
  }

  if (instanceId) {
    await TimerModel.setTimer({ instanceId })
  }

  next()
}

module.exports = {
  timersMiddleware,
}
