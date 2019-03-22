const db = require('../db/db')
const { uuidv4 } = require('../../common/uuid')

const { jobEvents, jobStatus } = require('./jobUtils')
const { throttle, cancelThrottle } = require('../../common/functionsDefer')

class JobEvent {

  constructor (type, status, total, processed) {
    this.type = type
    this.status = status
    this.total = total
    this.processed = processed
  }
}

class Job {

  constructor (type, params = {}, innerJobs = []) {
    this.params = params

    // context object (shared among nested jobs)
    this.context = {
      ...params
    }

    this.uuid = uuidv4()
    this.type = type
    this.status = jobStatus.pending
    this.startTime = null
    this.endTime = null
    this.total = 0
    this.processed = 0
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
      try {
        await this.onStart(tx)

        if (this.innerJobs.length > 0) {
          await this.executeInnerJobs(tx)
        } else {
          await this.execute(tx)
        }
        if (this.isRunning()) {
          await this.setStatusSucceeded()
        }
      } catch (e) {
        console.log('** Error in job ', e)
        this.addError({ systemError: { valid: false, errors: [e.toString()] } })
        await this.setStatusFailed()
      } finally {
        await this.onEnd(tx)
      }
      if (!this.isSucceeded()) {
        throw new Error('Job canceled or errors found; rollback transaction')
      }
    })
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

      innerJob.context = this.context

      innerJob.onEvent(this.handleInnerJobEvent.bind(this))

      await innerJob.start(tx)

      if (innerJob.isSucceeded())
        this.incrementProcessedItems()
      else
        break
    }
  }

  getCurrentInnerJob () {
    return this.innerJobs[this.currentInnerJobIndex]
  }

  async handleInnerJobEvent (event) {
    switch (event.status) {
      case jobStatus.failed:
      case jobStatus.canceled:
        //cancel or fail even parent job
        await this.setStatus(event.status)
        break
      default:
        await this.notifyEvent(event) //propagate events to parent job
    }
  }

  async cancel () {
    if (this.currentInnerJobIndex >= 0) {
      const innerJob = this.getCurrentInnerJob()
      if (innerJob.isRunning()) {
        await innerJob.cancel()
        //parent job will be canceled by the inner job event listener
      }
    } else {
      await this.setStatus(jobStatus.canceled)
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

  isSucceeded () {
    return this.status === jobStatus.succeeded
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

  async setStatus (status) {
    this.status = status

    const event = this.createJobEvent(jobEvents.statusChange)

    if (this.status === jobStatus.failed) {
      event.errors = this.errors
    }

    await this.notifyEvent(event)
  }

  async setStatusSucceeded () {
    await this.setStatus(jobStatus.succeeded)
  }

  async setStatusFailed () {
    await this.setStatus(jobStatus.failed)
  }

  incrementProcessedItems () {
    this.processed++

    throttle(
      async () => await this.notifyEvent(this.createJobEvent(jobEvents.progress)),
      this._getProgressThrottleId,
      1000
    )()
  }

  async notifyEvent (event) {
    if (this.eventListener) {
      this.eventListener(event)
    }
  }

  createJobEvent (type) {
    return new JobEvent(type, this.status, this.total, this.processed)
  }

  async onStart () {
    await this.setStatus(jobStatus.running)
    this.startTime = new Date()
  }

  async onEnd () {
    cancelThrottle(this._getProgressThrottleId())
  }

  getContextProp (prop, defaultValue = null) {
    const value = this.context[prop]
    return value ? value : defaultValue
  }

  setContext (context) {
    Object.assign(this.context, context)
  }

  setResult (result) {
    Object.assign(this.result, result)
  }

  /**
   * Utils
   */
  getSurvey () {
    return this.getContextProp('survey')
  }

  getSurveyId () {
    return this.getContextProp('surveyId')
  }

  getUser () {
    return this.getContextProp('user')
  }

  getUserId () {
    const user = this.getUser()
    return user ? user.id : null
  }

  /**
   * Internal
   */
  _getProgressThrottleId () {
    return `job-${this.uuid}-progress`
  }
}

module.exports = Job