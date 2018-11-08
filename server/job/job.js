const {uuidv4} = require('../../common/uuid')

const JobCommon = require('../../common/job/job')

/**
 * events:
 * - start: job has just started
 * - progress: job is running
 * - complete: job completed successfully
 * - fail: job failed with errors
 * - end: job completed successfully or failed
 */
class Job {

  constructor (userId, surveyId, name) {
    this.id = null
    this.uuid = uuidv4()
    this.userId = userId
    this.surveyId = surveyId
    this.props = {
      name,
    }
    this.status = JobCommon.jobStatus.pending
    this.canceled = false
    this.startTime = null
    this.totalItems = 0
    this.processedItems = 0
    this.result = null
    this.errors = null

    this.startListener = null
    this.progressListener = null
    this.completeListener = null
    this.failListener = null
    this.cancelListener = null
    this.endListener = null
  }

  start () {
    this.startTime = new Date()
    this.status = JobCommon.jobStatus.running
    this.notifyStart()
  }

  cancel () {
    this.status = JobCommon.jobStatus.canceled
    this.notifyCanceled()
  }

  onStart (listener) {
    this.startListener = listener
    return this
  }

  onProgress (listener) {
    this.progressListener = listener
    return this
  }

  onComplete (listener) {
    this.completeListener = listener
    return this
  }

  onEnd (listener) {
    this.endListener = listener
    return this
  }

  onFail (listener) {
    this.failListener = listener
    return this
  }

  onCancel (listener) {
    this.cancelListener = listener
    return this
  }

  isCancelled () {
    return JobCommon.isJobCanceled(this)
  }

  notifyStart () {
    if (this.startListener)
      this.startListener(this.createJobEvent())
  }

  notifyProgress () {
    if (this.progressListener)
      this.progressListener(this.createJobEvent())
  }

  notifyFailed () {
    this.status = JobCommon.jobStatus.failed

    if (this.failListener) {
      const event = {
        ...this.createJobEvent(),
        errors: this.errors
      }
      this.failListener(event)
    }
    this.notifyEnd()
  }

  notifyCompleted () {
    this.status = JobCommon.jobStatus.completed

    const end = new Date()
    const elapsedSeconds = (end.getTime() - this.startTime.getTime()) / 1000

    console.log(`job '${JobCommon.getJobName(this)}' completed in ${elapsedSeconds}s`)

    if (this.completeListener) {
      this.completeListener(this.createJobEvent())
    }
    this.notifyEnd()
  }

  notifyCanceled () {
    if (this.cancelListener) {
      this.cancelListener(this.createJobEvent())
    }
    this.notifyEnd()
  }

  notifyEnd () {
    if (this.endListener) {
      this.endListener(this.createJobEvent())
    }
  }

  createJobEvent () {
    return new JobEvent(this.id, this.status, this.totalItems, this.processedItems)
  }
}

class JobEvent {

  constructor (jobId, status, totalItems, processedItems) {
    this.jobId = jobId
    this.status = status
    this.totalItems = totalItems
    this.processedItems = processedItems
  }
}

module.exports = Job