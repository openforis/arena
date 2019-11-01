const { parentPort, workerData, isMainThread } = require('worker_threads')

const Log = require('@server/log/log')

const ThreadParams = require('./threadParams')

/**
 * Base class for thread execution in Worker Pool
 */
class Thread {

  constructor (params) {
    this.params = params ? params : { ...workerData }

    this.logger = Log.getLogger('Thread')

    if (!isMainThread)
      parentPort.on('message', this.messageHandler.bind(this))
  }

  get user () {
    return this.params[ThreadParams.keys.user]
  }

  get surveyId () {
    return this.params[ThreadParams.keys.surveyId]
  }

  /**
   * send message to main event loop
   * @param msg
   */
  postMessage (msg) {
    parentPort.postMessage({ user: this.user, surveyId: this.surveyId, msg })
  }

  async messageHandler (msg) {
    try {
      await this.onMessage(msg)
    } catch (e) {
      const error = e.toString()
      this.logger.error(`Error in thread:  ${error}`)
      this.logger.error(e.stack)
      this.postMessage({ type: Thread.messageTypes.error, error })
    }
  }

  /**
   * receive message from main event loop
   * @param msg
   */
  async onMessage (msg) {
    //TO OVERRIDE
  }

}

Thread.messageTypes = {
  error: 'error',
}

module.exports = Thread