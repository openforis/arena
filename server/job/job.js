const db = require('../db/db')

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
  async start (client = db) {
    try {
      await client.tx(async tx => {
        this.startTime = new Date()
        this.setStatus(jobStatus.running)

        const innerJobsSize = this.innerJobs.length
        if (innerJobsSize > 0) {
          this.total = innerJobsSize
          await this.startNextInnerJob(tx)
        } else {
          await this.execute(tx)
        }
      })
      if (this.isRunning()) {
        this.setStatusSucceeded()
      }
    } catch (e) {
      this.addError({systemError: {valid: false, errors: [e.toString()]}})
      this.setStatusFailed()
    }
  }

  addError (error) {
    this.errors['' + (this.processed + 1)] = error
  }

  /**
   * Abstract method to be extended by subclasses
   *
   * @param tx DB transaction
   */
  async execute (tx) {}

  getCurrentInnerJob () {
    return this.innerJobs[this.currentInnerJobIndex]
  }

  async startNextInnerJob (tx) {
    return new Promise(async resolve => {
      this.currentInnerJobIndex++

      const innerJob = this.getCurrentInnerJob()

      innerJob.context = this.context

      await innerJob
        .onEvent(async event => {
          await this.handleInnerJobEvent(event)
          if (innerJob.isEnded()) {
            resolve()
          }
        })
        .start(tx)
    })
  }

  async handleInnerJobEvent (event) {
    this.notifyEvent(event) //propagate events to parent job

    switch (event.status) {
      case jobStatus.failed:
      case jobStatus.canceled:
        //cancel or fail even parent job
        this.setStatus(event.status)
        break
      case jobStatus.succeeded:
        this.incrementProcessedItems()

        if (this.processed !== this.innerJobs.length) {
          await this.startNextInnerJob()
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