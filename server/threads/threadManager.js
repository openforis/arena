const {Worker} = require('worker_threads')

/**
 * Base class for managing communication between EventLoop and Thread in worker pool
 */
class ThreadManager {

  constructor (filePath, data, messageHandler, exitHandler = null) {
    this.worker = new Worker(filePath, {workerData: data})
    this.threadId = this.worker.threadId

    this.worker.on('message', messageHandler)

    this.worker.on('exit', () => {
      console.log(`thread ${this.threadId} ended`)
      if (exitHandler)
        exitHandler()
    })

    console.log(`thread ${this.threadId} created`)
  }

  /**
   * Post a message to thread in worker pool
   * @param message
   */
  postMessage (message) {
    this.worker.postMessage(message)
  }

  terminate () {
    this.worker.terminate()
  }

}

module.exports = ThreadManager