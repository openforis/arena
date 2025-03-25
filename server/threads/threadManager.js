import * as path from 'path'
import { Worker } from 'worker_threads'

import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import * as ProcessUtils from '@core/processUtils'
import * as User from '@core/user/user'

import * as Log from '@server/log/log'

import Thread from './thread'
import * as ThreadParams from './threadParams'

const workerEvents = {
  message: 'message',
  exit: 'exit',
}

/**
 * Base class for managing communication between EventLoop and Thread in worker pool.
 */
export default class ThreadManager {
  constructor(fileName, data, messageListener, exitHandler = null) {
    const filePath = path.resolve(ProcessUtils.ENV.arenaDist, fileName)

    this.worker = new Worker(filePath, { workerData: data })
    this.socketId = ThreadParams.getSocketId(data)
    this.threadId = this.worker.threadId
    this.logger = Log.getLogger(`ThreadManager - thread ID: ${this.threadId}`)

    this.addMessageListener(this.messageHandlerWrapper.bind(this)(messageListener))

    this.worker.on(workerEvents.exit, () => {
      this.logger.debug('thread ended')
      if (exitHandler) {
        exitHandler()
      }
    })

    this.logger.debug('thread created')
  }

  addMessageListener(listener) {
    this.worker.on(workerEvents.message, listener)
  }

  removeMessageListener(listener) {
    this.worker.removeListener(workerEvents.message, listener)
  }

  messageHandlerWrapper(messageHandler) {
    return ({ user, msg }) => {
      if (msg.type === Thread.messageTypes.error) {
        if (this.socketId) {
          WebSocketServer.notifySocket(this.socketId, WebSocketEvent.threadError, msg.error)
        } else {
          WebSocketServer.notifyUser(User.getUuid(user), WebSocketEvent.threadError, msg.error)
        }
      } else {
        messageHandler(msg)
      }
    }
  }

  /**
   * Post a message to thread in worker pool.
   * @param message
   */
  postMessage(message) {
    this.worker.postMessage(message)
  }

  terminate() {
    this.worker.terminate()
  }
}
