import Thread from '@server/threads/thread'

import { jobThreadMessageTypes, jobToJSON } from './jobUtils'
import * as JobCreator from './jobCreator'

class JobThread extends Thread {
  createJob() {
    const { jobType, jobParams } = this.params

    this.job = JobCreator.createJob(jobType, jobParams)

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
        console.log(`Skipping unknown message type: ${msg.type}`)
    }
  }

  sendJobToParentThread() {
    this.postMessage(jobToJSON(this.job))
  }
}

const thread = new JobThread()
thread.createJob()
