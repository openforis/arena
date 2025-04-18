import Thread from '@server/threads/thread'
import * as Log from '@server/log/log'

import { jobThreadMessageTypes, jobToJSON } from './jobUtils'
import * as JobCreator from './jobCreator'

const logger = Log.getLogger('JobThread')

class JobThread extends Thread {
  createJob() {
    const { jobType, jobParams, jobUuid } = this.params

    this.job = JobCreator.createJob(jobType, jobParams, jobUuid)

    this.job.onEvent(() => this.sendJobToParentThread())
    this.job.start()
  }

  async onMessage(msg) {
    switch (msg.type) {
      case jobThreadMessageTypes.fetchJob:
        this.sendJobToParentThread()
        break
      case jobThreadMessageTypes.cancelJob:
        await this.job.cancel()
        break
      default:
        logger.error(`Skipping unknown message type: ${msg.type}`)
    }
  }

  sendJobToParentThread() {
    this.postMessage(jobToJSON(this.job))
  }
}

const thread = new JobThread()
thread.createJob()
