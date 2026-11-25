import * as path from 'node:path'
import { Worker } from 'node:worker_threads'

import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import * as ProcessUtils from '@core/processUtils'
import * as User from '@core/user/user'
import * as Log from '@server/log/log'

import Thread from './thread'
import * as ThreadParams from './threadParams'

const workerEvents = {
  error: 'error',
  message: 'message',
  exit: 'exit',
}

type MessageListener = (msg: any) => void

// manages the communication between the event loop and a thread in the worker pool
export default class ThreadManager {
  readonly worker: Worker
  readonly socketId: string | undefined
  readonly threadId: number
  readonly logger: Log.Logger

  constructor(
    fileName: string,
    data: Record<string, any>,
    messageListener: MessageListener,
    exitHandler: (() => void) | null = null
  ) {
    const filePath = path.resolve(ProcessUtils.ENV.arenaDist, fileName)

    this.worker = new Worker(filePath, { workerData: data })
    this.socketId = ThreadParams.getSocketId(data)
    this.threadId = this.worker.threadId
    this.logger = Log.getLogger(`ThreadManager - thread ID: ${this.threadId}`)

    this.addMessageListener(this.messageHandlerWrapper.bind(this)(messageListener))

    this.worker.on(workerEvents.error, (error) => {
      // uncaught error in the thread: the 'exit' event will follow
      this.logger.error(`uncaught error in thread: ${error?.stack ?? error}`)
    })

    this.worker.on(workerEvents.exit, () => {
      this.logger.debug('thread ended')
      if (exitHandler) {
        exitHandler()
      }
    })

    this.logger.debug('thread created')
  }

  addMessageListener(listener: MessageListener): void {
    this.worker.on(workerEvents.message, listener)
  }

  removeMessageListener(listener: MessageListener): void {
    this.worker.removeListener(workerEvents.message, listener)
  }

  messageHandlerWrapper(messageHandler: MessageListener): MessageListener {
    return ({ user, msg }) => {
      const { type, error } = msg
      if (type === Thread.messageTypes.error) {
        if (this.socketId) {
          WebSocketServer.notifySocket(this.socketId, WebSocketEvent.threadError, error)
        } else {
          WebSocketServer.notifyUser(User.getUuid(user), WebSocketEvent.threadError, error)
        }
      } else {
        messageHandler(msg)
      }
    }
  }

  // posts a message to the thread in the worker pool
  postMessage(message: unknown): void {
    this.worker.postMessage(message)
  }

  terminate(): void {
    this.worker.terminate()
  }
}
