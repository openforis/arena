import Thread from '@server/threads/thread'
import * as Log from '@server/log/log'

import { jobThreadMessageTypes, jobToJSON } from './jobUtils'
import { startJobEnsuringEndNotification } from './jobRunner'
import * as JobCreator from './jobCreator'

const logger = Log.getLogger('JobThread')

class JobThread extends Thread {
  createJob() {
    const { jobType, jobParams, jobUuid } = this.params

    this.job = JobCreator.createJob(jobType, jobParams, jobUuid)
    this.jobEndNotified = false

    this.job.onEvent(() => this.sendJobToParentThread())
    startJobEnsuringEndNotification({
      job: this.job,
      isEndNotified: () => this.jobEndNotified,
      notifyJob: () => this.sendJobToParentThread(),
      logger,
    })
  }

  async onMessage(msg) {
    switch (msg.type) {
      case jobThreadMessageTypes.fetchJob:
        this.sendJobToParentThread()
        break
      case jobThreadMessageTypes.cancelJob:
        await this.job.cancel({ canceledByAdmin: msg.canceledByAdmin })
        break
      default:
        logger.error(`Skipping unknown message type: ${msg.type}`)
    }
  }

  sendJobToParentThread() {
    const jobSerialized = jobToJSON(this.job)
    this.postMessage(jobSerialized)
    if (jobSerialized.ended) {
      this.jobEndNotified = true
    }
  }
}

const thread = new JobThread()
thread.createJob()
