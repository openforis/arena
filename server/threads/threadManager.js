const { Worker } = require('worker_threads')
const WebSocket = require('../utils/webSocket')
const WebSocketEvents = require('../../common/webSocket/webSocketEvents')

/**
 * Base class for managing communication between EventLoop and Thread in worker pool
 */
class ThreadManager {

  constructor (filePath, data, messageHandler, exitHandler = null) {
    this.worker = new Worker(filePath, { workerData: data })
    this.threadId = this.worker.threadId

    this.worker.on('message', this.messageHandlerWrapper.bind(this)(messageHandler))

    this.worker.on('exit', () => {
      console.log(`thread ${this.threadId} ended`)
      if (exitHandler)
        exitHandler()
    })

    console.log(`thread ${this.threadId} created`)
  }

  messageHandlerWrapper (messageHandler) {
    return ({ user, msg }) => {
      if (msg.type === 'error') {
        WebSocket.notifyUser(user.id, WebSocketEvents.error, msg.error)
      } else {
        messageHandler(msg)
      }
    }
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