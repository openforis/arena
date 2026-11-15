import { parentPort, workerData, isMainThread } from 'node:worker_threads'

import * as Log from '@server/log/log'

import * as ThreadParams from './threadParams'
import { initArenaServerServices } from '@server/system/arenaServerServices'

// base class for the threads executed in the worker pool
export default class Thread {
  static readonly messageTypes = {
    error: 'error',
  }

  params: Record<string, any>
  logger: Log.Logger

  constructor(params?: Record<string, any>) {
    this.params = params || { ...workerData }

    this.logger = Log.getLogger('Thread')

    if (!isMainThread) {
      // ensure services are initialized
      initArenaServerServices()

      parentPort.on('message', this.messageHandler.bind(this))
    }
  }

  get user(): any {
    return this.params[ThreadParams.keys.user]
  }

  get surveyId(): number {
    return this.params[ThreadParams.keys.surveyId]
  }

  // sends a message to the main event loop
  postMessage(msg: Record<string, any>): void {
    parentPort.postMessage({ user: this.user ?? msg.user, surveyId: this.surveyId, msg })
  }

  async messageHandler(msg: Record<string, any>): Promise<void> {
    try {
      await this.onMessage(msg)
    } catch (error) {
      const { user } = msg
      const errorMessage = error.toString()
      this.logger.error(`Error in thread:  ${errorMessage}`)
      this.logger.error(error.stack)
      this.postMessage({ type: Thread.messageTypes.error, user, error: errorMessage })
    }
  }

  // receives a message from the main event loop (to override)
  async onMessage(_msg: Record<string, any>): Promise<void> {
    // TO OVERRIDE
  }
}
