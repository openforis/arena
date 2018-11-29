const {parentPort, workerData} = require('worker_threads')

/**
 * Base class for thread execution in Worker Pool
 */
class Thread {
  constructor () {
    this.params = {...workerData}
    parentPort.on('message', this.onMessage.bind(this))
  }

  /**
   * send message to main event loop
   * @param msg
   */
  postMessage (msg) {
    parentPort.postMessage(msg)
  }

  /**
   * receive message from main event loop
   * @param msg
   */
  onMessage (msg) {
    //TO OVERRIDE
  }

}

module.exports = Thread