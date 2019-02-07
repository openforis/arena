const db = require('../db/db')
const { uuidv4 } = require('../../common/uuid')

const { jobEvents, jobStatus } = require('./jobUtils')

const progressNotifyThreshold = 1 //notify progress only every 1% change

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

    const { user, surveyId } = params

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
    this.lastNotifyProcessed = 0
    this.result = {}
    this.errors = {}

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
    await client.tx(async tx => {
      this.setStatus(jobStatus.running)
      this.startTime = new Date()

      if (this.innerJobs.length > 0) {
        await this.executeInnerJobs(tx)
      } else {
        try {
          await this.execute(tx)
        } catch (e) {
          console.log('** Error in job ', e)
          this.addError({ systemError: { valid: false, errors: [e.toString()] } })
          this.setStatusFailed()
        }
      }
      if (!this.isRunning()) {
        throw new Error('Job canceled or errors found; rollback transaction')
      }
    })
    if (this.isRunning()) {
      this.setStatusSucceeded()
    }
  }

  addError (error) {
    this.errors['' + (this.processed + 1)] = error
  }

  /**
   * Abstract method to be extended by subclasses
   *
   * @param tx DB transaction
   *
   */
  async execute (tx) {}

  async executeInnerJobs (tx) {
    this.total = this.innerJobs.length

    //start each inner job and wait for it's completion before starting next one
    for (const innerJob of this.innerJobs) {
      ++this.currentInnerJobIndex

      innerJob.onEvent(this.handleInnerJobEvent.bind(this))

      await innerJob.start(tx)

      if (innerJob.isSuccedeed()) {
        this.incrementProcessedItems()
      } else {
        break
      }
    }
  }

  getCurrentInnerJob () {
    return this.innerJobs[this.currentInnerJobIndex]
  }

  handleInnerJobEvent (event) {
    this.notifyEvent(event) //propagate events to parent job

    switch (event.status) {
      case jobStatus.failed:
      case jobStatus.canceled:
        //cancel or fail even parent job
        this.setStatus(event.status)
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

  isSuccedeed () {
    return this.status = jobStatus.succeeded
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

    //notify progress event only for increments greater then 1%
    if (this.total <= 0 || (this.processed - this.lastNotifyProcessed) * 100 / this.total >= progressNotifyThreshold) {
      this.lastNotifyProcessed = this.processed
      this.notifyEvent(this.createJobEvent(jobEvents.progress))
    }
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