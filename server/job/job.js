import pgPromise from 'pg-promise'
import { SystemError as CoreSystemError } from '@openforis/arena-core'

import { db } from '@server/db/db'
import * as Log from '@server/log/log'

import { uuidv4 } from '@core/uuid'

import * as User from '@core/user/user'
import { throttle, cancelThrottle } from '@core/functionsDefer'

import SystemError from '@core/systemError'
import { jobEvents, jobStatus } from './jobUtils'
import { JobEvent } from './jobEvent'

/**
 * Status workflow:
 * - pending
 * - running
 * - (end)
 * -- succeed
 * -- failed
 * -- canceled.
 *
 * Methods that can be overwritten by subclasses:
 * - onStart (in tx)
 * - execute (in tx)
 * - beforeSuccess (in tx)
 * - beforeEnd (in tx)
 * - onEnd (out of tx).
 */
export default class Job {
  constructor(type, params = {}, innerJobs = []) {
    this.params = params

    // Context object (shared among nested jobs)
    this.context = {
      ...params,
    }

    this.uuid = uuidv4()
    this.type = type
    this.status = jobStatus.pending
    this.startTime = null
    this.endTime = null
    this.total = 0
    this._processed = 0
    this.result = {}
    this.errors = {}
    this.innerJobs = innerJobs
    this.currentInnerJobIndex = -1

    // configuration parameters
    this._stopOnInnerJobFailure = true

    this.eventListener = null

    this._logger = Log.getLogger(`Job ${this.constructor.name} (${this.uuid})`)
  }

  /**
   * Called by JobManager.
   * It starts the job execution.
   * If there are inner jobs, they are executed in order,
   * otherwise the "execute' method will be invoked.
   * This method should never be extended by subclasses;
   * extend the "process" method instead.
   * @param {pgPromise.IDatabase} [client=db] - The database client.
   */
  async start(client = db) {
    this.logDebug('start')

    // 1. crates a db transaction and run '_executeInTransaction' using it
    try {
      await client.tx(async (tx) => {
        this.tx = tx
        await this._executeInTransaction()
      })

      // 2. notify job status change to 'succeed' (when transaction has been committed)
      if (this.isRunning()) {
        await this._setStatusSucceeded()
      }
    } catch (error) {
      if (!this.isFailed() && (this.isRunning() || this.isSucceeded())) {
        // Error found, change status only if not changed already
        this.logError(`${error.stack || error}`)
        const isSystemError = error instanceof SystemError || error instanceof CoreSystemError
        const errorKey = `appErrors:${isSystemError ? error.key : 'generic'}`
        const errorParams = isSystemError ? error.params : { text: error.toString() }
        this.addError({
          error: {
            valid: false,
            errors: [{ key: errorKey, params: errorParams }],
          },
        })
        await this.setStatusFailed()
      }
    } finally {
      this.tx = null
    }
  }

  async shouldExecute() {
    return true
  }

  async _executeInTransaction() {
    try {
      // 1. notify start
      await this.onStart()

      const shouldExecute = await this.shouldExecute()
      this.logDebug('Should execute?', shouldExecute)

      if (shouldExecute) {
        // 2. execute
        if (this.innerJobs.length > 0) {
          await this._executeInnerJobs()
        } else {
          await this.execute()
        }

        // 3. execution completed, prepare result
        if (this.isRunning()) {
          this.logDebug('beforeSuccess...')
          await this.beforeSuccess()
          this.logDebug('beforeSuccess run')
        }
      }
      // DO NOT CATCH EXCEPTIONS! Transaction will be aborted in that case
    } finally {
      if (!this.isCanceled()) {
        // 4. flush/clean resources
        this.logDebug('beforeEnd (committing transaction)...')
        await this.beforeEnd()
        this.logDebug('beforeEnd run (transaction committed)')
      }

      this.tx = null
    }

    // 5. if errors found or job has been canceled, throw an error to rollback transaction
    if (!this.isRunning()) {
      throw new SystemError('jobCanceledOrErrorsFound')
    }
  }

  addError(error, errorKey = null) {
    if (!errorKey) {
      errorKey = String(this.processed + 1)
    }

    this.errors[errorKey] = error
  }

  hasErrors() {
    return Object.keys(this.errors).length > 0
  }

  /**
   * Abstract method to be extended by subclasses.
   */
  async execute() {
    // to be extended by subclasses
  }

  onEvent(listener) {
    this.eventListener = listener
    return this
  }

  isCanceled() {
    return this.status === jobStatus.canceled
  }

  isRunning() {
    return this.status === jobStatus.running
  }

  isSucceeded() {
    return this.status === jobStatus.succeeded
  }

  isFailed() {
    return this.status === jobStatus.failed
  }

  isEnded() {
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
  async cancel() {
    if (this.currentInnerJobIndex >= 0) {
      const innerJob = this.getCurrentInnerJob()
      if (innerJob.isRunning()) {
        await innerJob.cancel()
        // Parent job will be canceled by the inner job event listener
      }
    } else {
      await this.beforeEnd()
      await this._setStatus(jobStatus.canceled)
    }
  }

  notifyProgress() {
    throttle(
      async () => this._notifyEvent(this._createJobEvent(jobEvents.progress)),
      this._getProgressThrottleId(),
      1000
    )()
  }

  incrementProcessedItems(incrementBy = 1) {
    this.processed = this.processed + incrementBy
  }

  /**
   * Called when the job just has been started
   * (it runs INSIDE the current db transaction).
   */
  async onStart() {
    this.startTime = new Date()
    await this._setStatus(jobStatus.running)
  }

  /**
   * Called before onEnd only if the status will change to 'success'.
   * Prepares the result
   * (it runs INSIDE the current db transaction).
   */
  async beforeSuccess() {
    this.setResult(this.generateResult())
  }

  generateResult() {
    return {}
  }

  combineInnerJobsResults() {
    const results = {}
    this.innerJobs.forEach((innerJob) => Object.assign(results, innerJob.result ?? {}))
    return results
  }

  combineInnerJobsErrors() {
    const errors = {}
    this.innerJobs.forEach((innerJob) => Object.assign(errors, innerJob.errors ?? {}))
    return errors
  }

  /**
   * Called before onEnd.
   * Used to flush the resources used by the job before it terminates completely.
   * (it runs INSIDE the current db transaction).
   */
  async beforeEnd() {
    // To be extended by subclasses
  }

  /**
   * Called when the job status changes to success, failed or canceled
   * (it runs OUTSIDE of the current db transaction).
   */
  async onEnd() {
    this.endTime = new Date()
    cancelThrottle(this._getProgressThrottleId())
  }

  // UTILS
  getContextProp(prop, defaultValue = null) {
    const value = this.context[prop]
    return value || defaultValue
  }

  setContext(context) {
    Object.assign(this.context, context)
  }

  deleteContextProps(...propNames) {
    propNames.forEach((propName) => {
      delete this.context[propName]
    })
  }

  setResult(result) {
    Object.assign(this.result, result)
  }

  get contextSurvey() {
    return this.getContextProp(Job.keysContext.survey)
  }

  get surveyId() {
    return this.getContextProp(Job.keysContext.surveyId)
  }

  get user() {
    return this.getContextProp(Job.keysContext.user)
  }

  get userUuid() {
    return User.getUuid(this.user)
  }

  get stopOnInnerJobFailure() {
    return this._stopOnInnerJobFailure
  }

  set stopOnInnerJobFailure(value) {
    this._stopOnInnerJobFailure = value
  }

  get processed() {
    return this._processed
  }

  set processed(processedItems) {
    this._processed = processedItems
    this.notifyProgress()
  }

  getCurrentInnerJob() {
    return this.innerJobs[this.currentInnerJobIndex]
  }

  async setStatusFailed() {
    await this._setStatus(jobStatus.failed)
  }

  // INTERNAL METHODS
  async _executeInnerJobs() {
    this.total = this.innerJobs.length

    this.logDebug(`- ${this.total} inner jobs found`)

    // Start each inner job and wait for it's completion before starting next one
    for (const innerJob of this.innerJobs) {
      ++this.currentInnerJobIndex

      this.logDebug(`- running inner job ${this.currentInnerJobIndex + 1}`)

      // add inner job params to parent job context
      if (this.context && innerJob.context) {
        Object.assign(this.context, innerJob.context)
      }
      // share the same context object between parent and inner jobs
      innerJob.context = this.context

      innerJob.onEvent(this._handleInnerJobEvent.bind(this))

      await innerJob.start(this.tx)

      if (innerJob.isSucceeded()) {
        this.incrementProcessedItems()
      } else if (this.stopOnInnerJobFailure) {
        break
      }
    }

    this.logDebug(`- ${this.processed}/${this.total} inner jobs processed successfully`)
  }

  async _handleInnerJobEvent(event) {
    switch (event.status) {
      case jobStatus.failed:
        await this._setStatus(jobStatus.failed)
        break
      case jobStatus.canceled:
        // Cancel or fail even parent job
        if (!this.isCanceled()) {
          await this._setStatus(jobStatus.canceled)
        }
        break
      case jobStatus.running:
        // Propagate progress event to parent job
        await this._notifyEvent(this._createJobEvent(jobEvents.progress))
        break
      case jobStatus.succeeded:
        // do nothing
        break
      default:
        this.logDebug(`Unknown event status: ${event.status}`)
    }
  }

  async _setStatus(status) {
    this.logDebug(`set status: ${status}`)

    this.status = status

    const event = this._createJobEvent(jobEvents.statusChange)

    if (this.status === jobStatus.failed) {
      event.errors = this.errors
    }

    if (this.isEnded()) {
      this.logDebug('onEnd...')
      await this.onEnd()
      this.logDebug(`onEnd run. Job completed in ${this.elapsedTimePrettyFormat}`)
    }

    await this._notifyEvent(event)
  }

  async _setStatusSucceeded() {
    await this._setStatus(jobStatus.succeeded)
  }

  async _notifyEvent(event) {
    if (this.eventListener) {
      this.eventListener(event)
    }
  }

  get elapsedTimePrettyFormat() {
    const elapsedTime = this.endTime.getTime() - this.startTime.getTime()
    const elapsedMins = Math.floor(elapsedTime / 1000 / 60)
    const elapsedSeconds = String(Math.floor(elapsedTime / 1000) % 60).padStart(2, '0')
    const elapsedMillis = String(elapsedTime % 1000).padStart(3, '0')
    return `${elapsedMins}:${elapsedSeconds}.${elapsedMillis}`
  }

  _createJobEvent(type) {
    return new JobEvent(type, this.status, this.total, this.processed)
  }

  _getProgressThrottleId() {
    return `job-${this.uuid}-progress`
  }

  logDebug(...msgs) {
    this._logger.debug(...msgs)
  }

  logInfo(...msgs) {
    this._logger.info(...msgs)
  }

  logWarn(...msgs) {
    this._logger.warn(...msgs)
  }

  logError(...msgs) {
    this._logger.error(...msgs)
  }
}

// Static context keys
Job.keysContext = {
  surveyId: 'surveyId',
  survey: 'survey',
  user: 'user',
}
