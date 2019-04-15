const { parentPort, workerData, isMainThread } = require('worker_threads')

const threadMessageTypes = require('./threadMessageTypes')

/**
 * Base class for thread execution in Worker Pool
 */
class Thread {

  constructor (params) {
    this.params = params ? params : { ...workerData }

    this.user = this.params.user
    this.surveyId = this.params.surveyId

    if (!isMainThread)
      parentPort.on('message', this.messageHandler.bind(this))
  }

  async messageHandler (msg) {
    try {
      await this.onMessage(msg)
      this.postMessage({ type: threadMessageTypes.messageProcessComplete })
    } catch (e) {
      console.log('** Error in thread ', e)
      this.postMessage({ type: threadMessageTypes.error, error: e.toString() })
    }
  }

  /**
   * send message to main event loop
   * @param msg
   */
  postMessage (msg) {
    parentPort.postMessage({ user: this.getUser(), surveyId: this.getSurveyId(), msg })
  }

  /**
   * receive message from main event loop
   * @param msg
   */
  async onMessage (msg) {
    //TO OVERRIDE
  }

  getUser () {
    return this.params.user
  }

  getSurveyId () {
    return this.params.surveyId
  }

}

module.exports = Thread