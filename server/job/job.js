const {uuidv4} = require('../../common/uuid')

const JobCommon = require('../../common/job/job')

const eventTypes = {
  start: 'start', //job has just started
  progress: 'progress', //job is running
  complete: 'complete', //job completed successfully
  fail: 'fail', //job failed with errors
  cancel: 'cancel', //job has been canceled
  end: 'end', //job completed successfully or failed
  innerJob: 'innerJob', //inner job events

  all: 'all', //all events
}

class JobEvent {

  constructor (jobId, status, totalItems, processedItems) {
    this.jobId = jobId
    this.status = status
    this.totalItems = totalItems
    this.processedItems = processedItems
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
    this.status = JobCommon.jobStatus.pending
    this.canceled = false
    this.startTime = null
    this.totalItems = 0
    this.processedItems = 0
    this.result = {}
    this.errors = {}
    this.context = {} //context shared among inner jobs

    this.innerJobs = innerJobs
    this.currentInnerJobIndex = -1

    this.eventListeners = {}
  }

  start () {
    this.startTime = new Date()
    this.changeStatus(JobCommon.jobStatus.running)

    const innerJobsSize = this.innerJobs.length
    if (innerJobsSize > 0) {
      this.totalItems = innerJobsSize
      this.startNextInnerJob()
    }
  }

  startNextInnerJob () {
    this.currentInnerJobIndex ++
    const innerJob = this.innerJobs[this.currentInnerJobIndex]

    innerJob.context = this.context

    innerJob
      .onAllEvents(event => this.notifyEvent(eventTypes.innerJob, event)) //propagate events to parent job
      .onEnd(event => {
        switch (event.status) {
          case JobCommon.jobStatus.failed:
            this.changeStatus(event.status)
            break
          case JobCommon.jobStatus.canceled:
            this.changeStatus(event.status)
            break
          case JobCommon.jobStatus.completed:
            this.processedItems ++
            if (this.processedItems < this.innerJobs.length) {
              this.startNextInnerJob()
            } else {
              this.changeStatus(event.status)
            }
            break
        }
      })
    innerJob.start()
  }

  cancel () {
    this.changeStatus(JobCommon.jobStatus.canceled)
  }

  onStart (listener) {
    return this.addEventListener(eventTypes.start, listener)
  }

  onProgress (listener) {
    return this.addEventListener(eventTypes.progress, listener)
  }

  onComplete (listener) {
    return this.addEventListener(eventTypes.complete, listener)
  }

  onEnd (listener) {
    return this.addEventListener(eventTypes.end, listener)
  }

  onFail (listener) {
    return this.addEventListener(eventTypes.fail, listener)
  }

  onCancel (listener) {
    return this.addEventListener(eventTypes.cancel, listener)
  }

  onAllEvents (listener) {
    return this.addEventListener(eventTypes.all, listener)
  }

  addEventListener (type, listener) {
    this.eventListeners[type] = listener
    return this
  }

  onInnerJobEvent (listener) {
    this.eventListeners[eventTypes.innerJob] = listener
    return this
  }

  isCancelled () {
    return JobCommon.isJobCanceled(this)
  }

  changeStatus (status) {
    this.status = status

    if (status === JobCommon.jobStatus.completed) {
      const end = new Date()
      const elapsedSeconds = (end.getTime() - this.startTime.getTime()) / 1000

      console.log(`job '${JobCommon.getJobName(this)}' completed in ${elapsedSeconds}s`)
    }
    this.notifyStatusChangeEvent()
  }

  incrementProcessedItems () {
    this.processedItems ++
    this.notifyEvent(eventTypes.progress, this.createJobEvent())
  }

  notifyStatusChangeEvent () {
    const eventType = this.getStatusChangeEventType()
    const event = this.createJobEvent(eventType)
    if (this.status === JobCommon.jobStatus.failed) {
      event.errors = this.errors
    }
    this.notifyEvent(eventType, event)
  }

  notifyEvent (eventType, event) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType](event)
    }

    //notify end event
    if (this.eventListeners[eventTypes.end]) {
      switch (event.status) {
        case JobCommon.jobStatus.canceled:
        case JobCommon.jobStatus.completed:
        case JobCommon.jobStatus.failed:
          this.eventListeners[eventTypes.end](event)
      }
    }

    //notify "all" event
    if (this.eventListeners[eventTypes.all]) {
      this.eventListeners[eventTypes.all](event)
    }
  }

  getStatusChangeEventType () {
    switch (this.status) {
      case JobCommon.jobStatus.running:
        return eventTypes.start
      case JobCommon.jobStatus.canceled:
        return eventTypes.cancel
      case JobCommon.jobStatus.completed:
        return eventTypes.complete
      case JobCommon.jobStatus.failed:
        return eventTypes.fail
    }
  }

  createJobEvent () {
    return new JobEvent(this.id, this.status, this.totalItems, this.processedItems)
  }
}

module.exports = Job