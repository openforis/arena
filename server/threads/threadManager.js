import * as path from 'path'
import { Worker } from 'worker_threads';

import * as ProcessUtils from '@core/processUtils'
import * as User from '@core/user/user'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import * as Log from '@server/log/log'
import * as WebSocket from '@server/utils/webSocket'

import Thread from './thread'
import * as ThreadParams from './threadParams'

/**
 * Base class for managing communication between EventLoop and Thread in worker pool
 */
export default class ThreadManager {

  constructor (fileName, data, messageHandler, exitHandler = null) {
    const filePath = path.resolve(ProcessUtils.ENV.arenaDist, fileName)

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
