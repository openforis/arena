const { parentPort, workerData, isMainThread } = require('worker_threads')

const Log = require('../log/log')

const threadMessageTypes = require('./threadMessageTypes')
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

  async messageHandler (msg) {
    try {
      await this.onMessage(msg)
      this.postMessage({ type: threadMessageTypes.messageProcessComplete })
    } catch (e) {
      const error = e.toString()
      this.logger.error(`Error in thread:  ${error}`)
      this.postMessage({ type: threadMessageTypes.error, error })
    }
  }

  /**
   * send message to main event loop
   * @param msg
   */
  postMessage (msg) {
    parentPort.postMessage({ user: this.user, surveyId: this.surveyId, msg })
  }

  /**
   * receive message from main event loop
   * @param msg
   */
  async onMessage (msg) {
    //TO OVERRIDE
  }

  _getParam (name) {
    return this.params[name]
  }

  get user () {
    return this._getParam(ThreadParams.keys.user)
  }

  get surveyId () {
    return this._getParam(ThreadParams.keys.surveyId)
  }

}

module.exports = Thread