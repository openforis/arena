const db = require('../db/db')
const Log = require('../log/log')

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

/**
 * Methods that can be overwritten by subclasses:
 * - onStart
 * - execute
 * - prepareResult
 * - onEnd
 */
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
    Log.debug('JOB ' + this.constructor.name + ' START')

    await client.tx(async tx => {
      try {
        this.tx = tx
        await this.onStart()

        if (this.innerJobs.length > 0) {
          await this._executeInnerJobs()
        } else {
          await this.execute(tx)
        }
        if (this.isRunning()) {
          await this.prepareResult()
          await this._setStatusSucceeded()
        }
      } catch (e) {
        console.log('** Error in job ', e)
        this.addError({ systemError: { valid: false, errors: [e.toString()] } })
        if (this.isRunning())
          await this.setStatusFailed()
      } finally {
        this.tx = null
      }
      if (!this.isSucceeded()) {
        throw new Error('Job canceled or errors found; rollback transaction')
      }
    })

    Log.debug('JOB ' + this.constructor.name + ' END')
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

  async prepareResult () {
    //to be extended by subclasses
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

  // DO NOT OVERWRITE IT
  async cancel () {
    if (this.currentInnerJobIndex >= 0) {
      const innerJob = this.getCurrentInnerJob()
      if (innerJob.isRunning()) {
        await innerJob.cancel()
        //parent job will be canceled by the inner job event listener
      }
    } else {
      await this._setStatus(jobStatus.canceled)
    }
  }

  incrementProcessedItems (incrementBy = 1) {
    this.processed += incrementBy

    throttle(
      async () => await this._notifyEvent(this._createJobEvent(jobEvents.progress)),
      this._getProgressThrottleId,
      1000
    )()
  }

  async onStart () {
    this.startTime = new Date()
    await this._setStatus(jobStatus.running)
  }

  async onEnd () {
    this.endTime = new Date()
    cancelThrottle(this._getProgressThrottleId())
  }

  // UTILS
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

  getCurrentInnerJob () {
    return this.innerJobs[this.currentInnerJobIndex]
  }

  async setStatusFailed () {
    await this._setStatus(jobStatus.failed)
  }

  // INTERNAL METHODS
  async _executeInnerJobs () {
    this.total = this.innerJobs.length

    //start each inner job and wait for it's completion before starting next one
    for (const innerJob of this.innerJobs) {
      ++this.currentInnerJobIndex

      innerJob.context = this.context

      innerJob.onEvent(this._handleInnerJobEvent.bind(this))

      await innerJob.start(this.tx)

      if (innerJob.isSucceeded())
        this.incrementProcessedItems()
      else
        break
    }
  }

  async _handleInnerJobEvent (event) {
    switch (event.status) {
      case jobStatus.failed:
      case jobStatus.canceled:
        //cancel or fail even parent job
        await this._setStatus(event.status)
        break
      default:
        await this._notifyEvent(event) //propagate events to parent job
    }
  }

  async _setStatus (status) {
    this.status = status

    const event = this._createJobEvent(jobEvents.statusChange)

    if (this.status === jobStatus.failed) {
      event.errors = this.errors
    }

    if (this.isEnded())
      await this.onEnd()

    await this._notifyEvent(event)
  }

  async _setStatusSucceeded () {
    await this._setStatus(jobStatus.succeeded)
  }

  async _notifyEvent (event) {
    if (this.eventListener) {
      this.eventListener(event)
    }
  }

  _createJobEvent (type) {
    return new JobEvent(type, this.status, this.total, this.processed)
  }

  _getProgressThrottleId () {
    return `job-${this.uuid}-progress`
  }
}

module.exports = Job