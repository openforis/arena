const {parentPort, workerData, isMainThread} = require('worker_threads')

/**
 * Base class for thread execution in Worker Pool
 */
class Thread {

  constructor () {
    this.params = {...workerData}
    this.user = this.params.user
    this.surveyId = this.params.surveyId

    if (!isMainThread)
      parentPort.on('message', this.messageHandler.bind(this))
  }

  async messageHandler (msg) {
    try {
      await this.onMessage(msg)
    } catch (e) {
      this.postMessage({type: 'error', error: e.toString()})
    }
  }

  /**
   * send message to main event loop
   * @param msg
   */
  postMessage (msg) {
    parentPort.postMessage({user: this.user, surveyId: this.surveyId, msg})
  }

  /**
   * receive message from main event loop
   * @param msg
   */
  async onMessage (msg) {
    //TO OVERRIDE
  }

}

module.exports = Thread