import {parentPort, workerData, isMainThread} from 'worker_threads'

import * as Log from '@server/log/log'

import * as ThreadParams from './threadParams'

/**
 * Base class for thread execution in Worker Pool
 */
export default class Thread {
  constructor(params) {
    this.params = params ? params : {...workerData}

    this.logger = Log.getLogger('Thread')

    if (!isMainThread)
      {parentPort.on('message', this.messageHandler.bind(this))}
  }

  get user() {
    return this.params[ThreadParams.keys.user]
  }

  get surveyId() {
    return this.params[ThreadParams.keys.surveyId]
  }

  /**
   * Send message to main event loop
   * @param msg
   */
  postMessage(msg) {
    parentPort.postMessage({user: this.user, surveyId: this.surveyId, msg})
  }

  async messageHandler(msg) {
    try {
      await this.onMessage(msg)
    } catch (error) {
      const error = error.toString()
      this.logger.error(`Error in thread:  ${error}`)
      this.logger.error(error.stack)
      this.postMessage({type: Thread.messageTypes.error, error})
    }
  }

  /**
   * Receive message from main event loop
   * @param msg
   */
  async onMessage(msg) {
    // TO OVERRIDE
  }
}

Thread.messageTypes = {
  error: 'error',
}
