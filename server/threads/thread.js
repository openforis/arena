const {Worker} = require('worker_threads')

class Thread {

  constructor (filePath, data, messageHandler, exitHandler = null) {
    this.worker = new Worker(filePath, {workerData: data})
      .on('message', messageHandler)
      .on('exit', () => {
        console.log(`thread ${this.threadId} ended`)
        if (exitHandler)
          exitHandler()
      })
    this.threadId = this.worker.threadId

    console.log(`thread ${this.threadId} created`)
  }

  postMessage (message) {
    this.worker.postMessage(message)
  }

  terminate () {
    this.worker.terminate()
  }

}

module.exports = Thread