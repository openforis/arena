const { Worker } = require('worker_threads')

const Log = require('../log/log')

const WebSocket = require('../utils/webSocket')

const User = require('../../common/user/user')
const WebSocketEvents = require('../../common/webSocket/webSocketEvents')

const Thread = require('./thread')
const ThreadParams = require('./threadParams')

/**
 * Base class for managing communication between EventLoop and Thread in worker pool
 */
class ThreadManager {

  constructor (filePath, data, messageHandler, exitHandler = null) {
    this.worker = new Worker(filePath, { workerData: data })
    this.socketId = ThreadParams.getSocketId(data)
    this.threadId = this.worker.threadId
    this.logger = Log.getLogger(`ThreadManager - thread ID: ${this.threadId}`)

    this.worker.on('message', this.messageHandlerWrapper.bind(this)(messageHandler))

    this.worker.on('exit', () => {
      this.logger.debug('thread ended')
      if (exitHandler)
        exitHandler()
    })

    this.logger.debug('thread created')
  }

  messageHandlerWrapper (messageHandler) {
    return ({ user, msg }) => {
      if (msg.type === Thread.messageTypes.error) {
        if (this.socketId) {
          WebSocket.notifySocket(this.socketId, WebSocketEvents.error, msg.error)
        } else {
          WebSocket.notifyUser(User.getUuid(user), WebSocketEvents.error, msg.error)
        }
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