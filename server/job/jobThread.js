const Thread = require('../threads/thread')

const {jobThreadMessageTypes, jobToJSON} = require('./jobUtils')
const JobCreator = require('./jobCreator')

class JobThread extends Thread {

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

  onMessage (msg) {
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