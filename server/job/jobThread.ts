import Thread from '../threads/thread';

import {jobThreadMessageTypes, jobToJSON} from './jobUtils'
import JobCreator from './jobCreator';

class JobThread extends Thread {
	private job: any;

  constructor () {
    super()

    this.createJob()
  }

  createJob () {
    const {jobType, jobParams} = this.params

    this.job = JobCreator.createJob(jobType, jobParams)

    this.job.onEvent(() => this.sendJobToParentThread())
    this.job.start()
  }

  async onMessage (msg) {
    switch (msg.type) {
      case jobThreadMessageTypes.fetchJob:
        this.sendJobToParentThread()
        break
      case jobThreadMessageTypes.cancelJob:
        this.job.cancel()
        break
    }
  }

  sendJobToParentThread () {
    this.postMessage(jobToJSON(this.job))
  }
}

new JobThread()
