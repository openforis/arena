const {uuidv4} = require('../../common/uuid')

const {jobStatus} = require('../../common/job/job')
const JobCommon = require('../../common/job/job')

const jobEventTypes = {
  statusChange: 'statusChange', //job has changed its status
  progress: 'progress', //job is running and the processed items changed
}

class JobEvent {

  constructor (type, jobId, status, total, processed) {
    this.type = type
    this.jobId = jobId
    this.status = status
    this.total = total
    this.processed = processed
  }
}

class Job {

  constructor (userId, surveyId, name, innerJobs = []) {
    this.id = null
    this.uuid = uuidv4()
    this.userId = userId
    this.surveyId = surveyId
    this.props = {
      name,
    }
    this.status = jobStatus.pending
    this.startTime = null
    this.endTime = null
    this.total = 0
    this.processed = 0
    this.result = {}
    this.errors = {}
    this.context = {} //context shared among inner jobs

    this.innerJobs = innerJobs
    this.currentInnerJobIndex = -1

    this.eventListener = null
  }

  /**
   * Called by JobManager.
   * It starts the job execution.
   * If there are inner jobs, they are executed in order,
   * otherwise the "process' method will be invoked.
   * This method should never be extended by subclasses;
   * extend the "process" method instead.
   */
  start () {
    this.startTime = new Date()
    this.changeStatus(jobStatus.running)

    const innerJobsSize = this.innerJobs.length
    if (innerJobsSize > 0) {
      this.total = innerJobsSize
      this.startNextInnerJob()
    } else {
      this.calculateTotal()
        .then(total => {
          this.total = total
          try {
            this.process()
          } catch (e) {
            this.errors = [e.toString()]
            this.changeStatus(jobStatus.failed)
          }
        })
    }
  }

  /**
   * Abstract method to be extended by subclasses
   */
  process () {}

  /**
   * To be extended by subclasses
   */
  calculateTotal () {
    return new Promise((resolve) => resolve(0))
  }

  startNextInnerJob () {
    this.currentInnerJobIndex++
    const innerJob = this.innerJobs[this.currentInnerJobIndex]

    innerJob.context = this.context

    innerJob
      .onEvent(event => {
        this.notifyEvent(event) //propagate events to parent job

        switch (event.status) {
          case jobStatus.failed:
          case jobStatus.canceled:
            this.changeStatus(event.status)
            break
          case jobStatus.completed:
            this.incrementProcessedItems()

            if (this.processed === this.innerJobs.length) {
              this.changeStatus(jobStatus.completed)
            } else {
              this.startNextInnerJob()
            }
            break
        }
      })
      .start()
  }

  cancel () {
    this.changeStatus(jobStatus.canceled)
  }

  onEvent (listener) {
    this.eventListener = listener
    return this
  }

  isCancelled () {
    return JobCommon.isJobCanceled(this)
  }

  changeStatus (status) {
    this.status = status

    if (status === jobStatus.completed) {
      this.endTime = new Date()
      const elapsedSeconds = (this.endTime.getTime() - this.startTime.getTime()) / 1000

      console.log(`job '${JobCommon.getJobName(this)}' completed in ${elapsedSeconds}s`)
    }
    //notify event
    const event = this.createJobEvent(jobEventTypes.statusChange)
    if (this.status === jobStatus.failed) {
      event.errors = this.errors
    }
    this.notifyEvent(event)
  }

  incrementProcessedItems () {
    this.processed++
    this.notifyEvent(this.createJobEvent(jobEventTypes.progress))
  }

  notifyEvent (event) {
    if (this.eventListener) {
      this.eventListener(event)
    }
  }

  createJobEvent (type) {
    return new JobEvent(type, this.id, this.status, this.total, this.processed)
  }

  toSummary () {
    return {
      id: this.id,
      uuid: this.uuid,
      userId: this.userId,
      surveyId: this.surveyId,
      status: this.status,
      props: {
        name: this.props.name,
        result: this.status === jobStatus.completed ? this.result : {},
        errors: this.status === jobStatus.failed ? this.errors : {},
      },
      total: this.total,
      processed: this.processed,
      innerJobs: this.innerJobs.map(j => j.toSummary())
    }
  }

}

module.exports = {
  jobEventTypes,
  Job,
}