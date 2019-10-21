import { Worker } from 'worker_threads'

import Log, { Logger } from '../log/log'

import WebSocket from '../utils/webSocket'

import User from '../../core/user/user'
import WebSocketEvents from '../../common/webSocket/webSocketEvents'

import Thread from './thread'
import ThreadParams from './threadParams'

/**
 * Base class for managing communication between EventLoop and Thread in worker pool
 */
export default class ThreadManager {
	public worker: Worker;
	public socketId: any;
	public threadId: number;
	public logger: Logger;

  constructor (
    filePath: string,
    data: any,
    messageHandler: (msg: any) => Promise<void>,
    exitHandler?: () => void,
  ) {
    this.worker = new Worker(filePath, { workerData: data })
    this.socketId = ThreadParams.getSocketId(data)
    this.threadId = this.worker.threadId
    this.logger = Log.getLogger(`ThreadManager - thread ID: ${this.threadId}`)

    this.worker.on('message', this.messageHandlerWrapper.bind(this)(messageHandler))

    this.worker.on('exit', () => {
      this.logger.debug('thread ended')
      if (exitHandler) exitHandler()
      // TODO: notify websocket that there's nothing to wait for, anymore.
    })

    this.logger.debug('thread created')
  }

  messageHandlerWrapper (messageHandler: (msg: any) => Promise<void>) {
    return async ({ user, msg }) => {
      if (msg.type === Thread.messageTypes.error) {
        if (this.socketId) {
          WebSocket.notifySocket(this.socketId, WebSocketEvents.error, msg.error)
        } else {
          WebSocket.notifyUser(User.getUuid(user), WebSocketEvents.error, msg.error)
        }
      } else {
        await messageHandler(msg)
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
