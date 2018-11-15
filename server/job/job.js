const {jobEvents, jobStatus} = require('./jobUtils')

const {uuidv4} = require('../../common/uuid')

class JobEvent {

  constructor (type, jobId, masterJobId, status, total, processed) {
    this.type = type
    this.jobId = jobId
    this.masterJobId = masterJobId
    this.status = status
    this.total = total
    this.processed = processed
  }
}

class Job {

  constructor (type, userId, surveyId, innerJobs = []) {
    this.id = null
    this.parentId = null
    this.masterJobId = null //id of the master job (parentId === null for that job)
    this.uuid = uuidv4()
    this.userId = userId
    this.surveyId = surveyId
    this.type = type
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
   * otherwise the "execute' method will be invoked.
   * This method should never be extended by subclasses;
   * extend the "process" method instead.
   */
  start () {
    this.startTime = new Date()
    this.setStatus(jobStatus.running)

    const innerJobsSize = this.innerJobs.length
    if (innerJobsSize > 0) {
      this.total = innerJobsSize
      this.startNextInnerJob()
    } else {
      this.calculateTotal()
        .then(total => {
          this.total = total
          try {
            this.execute()
          } catch (e) {
            this.errors = [e.toString()]
            this.setStatusFailed()
          }
        })
    }
  }

  /**
   * Abstract method to be extended by subclasses
   */
  execute () {}

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
            this.setStatus(event.status)
            break
          case jobStatus.succeeded:
            this.incrementProcessedItems()

            if (this.processed === this.innerJobs.length) {
              this.setStatusSucceeded()
            } else {
              this.startNextInnerJob()
            }
            break
        }
      })
      .start()
  }

  cancel () {
    this.setStatus(jobStatus.canceled)
  }

  onEvent (listener) {
    this.eventListener = listener
    return this
  }

  isCancelled () {
    return this.status === jobStatus.canceled
  }

  isEnded () {
    switch (this.status) {
      case jobStatus.succeeded:
      case jobStatus.failed:
      case jobStatus.canceled:
        return true
      default:
        return false
    }
  }

  setStatus (status) {
    this.status = status

    const event = this.createJobEvent(jobEvents.statusChange)
    if (this.status === jobStatus.failed) {
      event.errors = this.errors
    }
    this.notifyEvent(event)
  }

  setStatusSucceeded () {
    this.setStatus(jobStatus.succeeded)
  }

  setStatusFailed () {
    this.setStatus(jobStatus.failed)
  }

  incrementProcessedItems () {
    this.processed++
    this.notifyEvent(this.createJobEvent(jobEvents.progress))
  }

  notifyEvent (event) {
    if (this.eventListener) {
      this.eventListener(event)
    }
  }

  createJobEvent (type) {
    return new JobEvent(type, this.id, this.masterJobId, this.status, this.total, this.processed)
  }
}

module.exports = Job