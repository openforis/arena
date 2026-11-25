import * as Log from '@server/log/log'
import Thread from '@server/threads/thread'

import type Job from './job'
import * as JobCreator from './jobCreator'
import { startJobEnsuringEndNotification } from './jobRunner'
import { jobThreadMessageTypes, jobToJSON } from './jobUtils'

const logger = Log.getLogger('JobThread')

class JobThread extends Thread {
  private job: Job
  private jobEndNotified: boolean

  createJob(): void {
    const { jobType, jobParams, jobUuid } = this.params

    this.job = JobCreator.createJob(jobType, jobParams, jobUuid)
    this.jobEndNotified = false

    this.job.onEvent(() => this.sendJobToParentThread())
    void startJobEnsuringEndNotification({
      job: this.job,
      isEndNotified: () => this.jobEndNotified,
      notifyJob: () => this.sendJobToParentThread(),
      logger,
    })
  }

  async onMessage(msg: Record<string, any>): Promise<void> {
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

  sendJobToParentThread(): void {
    const jobSerialized = jobToJSON(this.job)
    this.postMessage(jobSerialized)
    if (jobSerialized.ended) {
      this.jobEndNotified = true
    }
  }
}

const thread = new JobThread()
thread.createJob()
