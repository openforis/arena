import db from '../db/db'
import { getLogger, Logger } from '../log/log'

import { uuidv4 } from '../../core/uuid'

import { jobEvents, jobStatus } from './jobUtils'

import { getUuid } from '../../core/user/user'
import { throttle, cancelThrottle } from '../../core/functionsDefer'

import SystemError from '../utils/systemError'

class JobEvent {
  type: any
  status: any
  total: any
  processed: any
  errors: any

  constructor (type, status, total, processed) {
    this.type = type
    this.status = status
    this.total = total
    this.processed = processed
  }
}

/**
 * Status workflow:
 * - pending
 * - running
 * - (end)
 * -- succeed
 * -- failed
 * -- canceled
 *
 * Methods that can be overwritten by subclasses:
 * - onStart
 * - execute
 * - beforeSuccess
 * - beforeEnd
 * - onEnd
 */
export default class Job {
  static keysContext: any
  params: {}
  context: {}
  uuid: string
  type: string
  status: any
  startTime: Date | null
  endTime: Date | null
  total: number
  processed: number
  result: {}
  errors: {}
  innerJobs: Job[]
  currentInnerJobIndex: number
  eventListener: ((event: JobEvent) => void) | null
  _logger: Logger
  tx?: any

  constructor (type: string, params = {}, innerJobs: Job[] = []) {
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

    this._logger = getLogger(`Job ${this.constructor.name}`)
  }

  /**
   * Called by JobManager.
   * It starts the job execution.
   * If there are inner jobs, they are executed in order,
   * otherwise the "execute' method will be invoked.
   * This method should never be extended by subclasses;
   * extend the "process" method instead.
   */
  async start (client: any = db) {
    this.logDebug('start')

    // 1. crates a db transaction and run '_executeInTransaction' into it
    try {
      await client.tx(tx => this._executeInTransaction(tx))

      // 2. notify job status change to 'succeed' (when transaction has been committed)
      if (this.isRunning()) {
        await this._setStatusSucceeded()
      }
    } catch (e) {
      console.error('EEDED',e, JSON.stringify(e));
      if (this.isRunning()) {
        // error found, change status only if not changed already
        this.logError(`${e.stack || e}`)
        this.addError({
          error: {
            valid: false,
            errors: [{ key: 'appErrors.generic', params: { text: e.toString() } }],
          },
        })
        await this.setStatusFailed()
      }
    }
  }

  async shouldExecute () {
    return true
  }

  async _executeInTransaction (tx) {
    try {
      this.tx = tx

      // 1. notify start
      await this.onStart()

      const shouldExecute = await this.shouldExecute()
      this.logDebug('Should execute?', shouldExecute)

      if (shouldExecute) {
        // 2. execute
        if (this.innerJobs.length > 0) {
          await this._executeInnerJobs()
        } else {
          await this.execute(tx)
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
        this.logDebug('beforeEnd...')
        await this.beforeEnd()
        this.logDebug('beforeEnd run')
      }
      this.tx = null
    }
    // 5. if errors found or job has been canceled, throw an error to rollback transaction
    if (!this.isRunning()) {
      throw new SystemError('jobCanceledOrErrorsFound')
    }
  }

  addError (error, errorKey: string | null = null) {
    if (!errorKey)
      errorKey = '' + (this.processed + 1)
    this.errors[errorKey] = error
  }

  hasErrors () {
    return Object.keys(this.errors).length > 0
  }

  /**
   * Abstract method to be extended by subclasses
   *
   * @param tx DB transaction
   *
   */
  async execute (tx) {}

  onEvent (listener: (event: JobEvent) => void) {
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

  isFailed () {
    return this.status === jobStatus.failed
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
      await this.beforeEnd()
      await this._setStatus(jobStatus.canceled)
    }
  }

  incrementProcessedItems (incrementBy = 1) {
    this.processed += incrementBy

    throttle(
      async () => await this._notifyEvent(this._createJobEvent(jobEvents.progress)),
      this._getProgressThrottleId(),
      1000
    )()
  }

  /**
   * Called when the job just has been started
   * (it runs INSIDE the current db transaction)
   */
  async onStart () {
    this.startTime = new Date()
    await this._setStatus(jobStatus.running)
  }

  /**
   * Called before onEnd only if the status will change to 'success'.
   * Prepares the result
   * (it runs INSIDE the current db transaction)
   */
  async beforeSuccess () {
    //to be extended by subclasses
  }

  /**
   * Called before onEnd.
   * Used to flushes the resources used by the job before it terminates completely.
   * (it runs INSIDE the current db transaction)
   */
  async beforeEnd () {
    //to be extended by subclasses
  }

  /**
   * Called when the job status changes to success, failed or canceled
   * (it runs OUTSIDE of the current db transaction)
   */
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

  get contextSurvey () {
    return this.getContextProp(Job.keysContext.survey)
  }

  get surveyId () {
    return this.getContextProp(Job.keysContext.surveyId)
  }

  get user () {
    return this.getContextProp(Job.keysContext.user)
  }

  get userUuid () {
    return getUuid(this.user)
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

    this.logDebug(`- ${this.total} inner jobs found`)

    //start each inner job and wait for it's completion before starting next one
    for (const innerJob of this.innerJobs) {
      ++this.currentInnerJobIndex

      this.logDebug(`- running inner job ${this.currentInnerJobIndex + 1}`)

      innerJob.context = this.context

      innerJob.onEvent(this._handleInnerJobEvent.bind(this))

      await innerJob.start(this.tx)

      if (innerJob.isSucceeded())
        this.incrementProcessedItems()
      else
        break
    }
    this.logDebug(`- ${this.processed} inner jobs processed successfully`)
  }

  async _handleInnerJobEvent (event: { status: any; }) {
    switch (event.status) {
      case jobStatus.failed:
      case jobStatus.canceled:
        //cancel or fail even parent job
        await this._setStatus(event.status)
        break
      case jobStatus.running:
        //propagate progress event to parent job
        await this._notifyEvent(this._createJobEvent(jobEvents.progress))
        break
    }
  }

  async _setStatus (status) {
    this.logDebug(`set status: ${status}`)

    this.status = status

    const event = this._createJobEvent(jobEvents.statusChange)

    if (this.status === jobStatus.failed) {
      event.errors = this.errors
    }

    if (this.isEnded()) {
      this.logDebug('onEnd...')
      await this.onEnd()
      this.logDebug('onEnd run')
    }
    await this._notifyEvent(event)
  }

  async _setStatusSucceeded () {
    await this._setStatus(jobStatus.succeeded)
  }

  async _notifyEvent (event: JobEvent) {
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

  logDebug (...msgs) {
    this._logger.debug(...msgs)
  }

  logError (...msgs) {
    this._logger.error(...msgs)
  }

}

// static context keys
Job.keysContext = {
  surveyId: 'surveyId',
  survey: 'survey',
  user: 'user',
}
