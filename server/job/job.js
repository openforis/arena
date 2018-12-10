const {jobEvents, jobStatus} = require('./jobUtils')

const {uuidv4} = require('../../common/uuid')

class JobEvent {

  constructor (type, status, total, processed) {
    this.type = type
    this.status = status
    this.total = total
    this.processed = processed
  }
}

class Job {

  constructor (type, params, innerJobs = []) {
    this.params = params

    const {user, surveyId} = params

    this.user = user
    this.userId = user.id
    this.surveyId = surveyId

    this.uuid = uuidv4()
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

  getCurrentInnerJob () {
    return this.innerJobs[this.currentInnerJobIndex]
  }

  startNextInnerJob () {
    this.currentInnerJobIndex++

    const innerJob = this.getCurrentInnerJob()

    innerJob.context = this.context

    innerJob
      .onEvent(event => {
        this.handleInnerJobEvent(event)
      })
      .start()
  }

  handleInnerJobEvent (event) {
    this.notifyEvent(event) //propagate events to parent job

    switch (event.status) {
      case jobStatus.failed:
      case jobStatus.canceled:
        //cancel or fail even parent job
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
  }

  cancel () {
    if (this.currentInnerJobIndex >= 0) {
      const innerJob = this.getCurrentInnerJob()
      if (innerJob.isRunning()) {
        innerJob.cancel()
        //parent job will be canceled by the inner job event listener
      }
    } else {
      this.setStatus(jobStatus.canceled)
    }
  }

  onEvent (listener) {
    this.eventListener = listener
    return this
  }

  isCanceled () {
    return this.status === jobStatus.canceled
  }

  isRunning () {
    return this.status === jobStatus.running
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
    return new JobEvent(type, this.status, this.total, this.processed)
  }

}

module.exports = Job