import { Objects, Queue } from '@openforis/arena-core'

import * as Log from '@server/log/log'

import * as JobThreadExecutor from './jobThreadExecutor'

export class JobQueue {
  constructor() {
    this._logger = Log.getLogger('JobQueue')

    this._queue = new Queue()

    this._maxConcurrentJobs = 3

    this._runningGlobalJob = false
    this._jobInfoByUuid = {} // all jobs (running or queued)
    this._jobUuidByUserUuid = {} // jobs per user (running or queued)
    this._runningJobUuidByUuid = {} // running jobs
    this._runningJobUuidBySurveyId = {} // running jobs by survey id
    this._runningJobUuidByUserUuid = {} // running jobs by user uuid
  }

  isRunning() {
    return Objects.isNotEmpty(this._runningJobUuidByUuid)
  }

  _getJobInfoByUserUuid(userUuid) {
    const jobUuid = this._jobUuidByUserUuid[userUuid]
    return this._jobInfoByUuid[jobUuid]
  }

  getRunningJobSummaryByUserUuid(userUuid) {
    const jobInfo = this._getJobInfoByUserUuid(userUuid)
    if (!jobInfo) {
      return null
    }
    const { params, uuid: jobUuid } = jobInfo
    if (this._runningJobUuidByUserUuid(jobUuid)) {
      const { user } = params
      const { uuid: userUuid } = user
      return JobThreadExecutor.getActiveJobSummary(userUuid)
    } else {
      return jobInfo
    }
  }

  async cancelJobByUserUuid(userUuid) {
    const jobUuid = this._jobUuidByUserUuid[userUuid]
    if (!jobUuid) return
    if (this._runningJobUuidByUserUuid[userUuid]) {
      // cancel job thread
      await JobThreadExecutor.cancelActiveJobByUserUuid(userUuid)
    } else {
      // remove job from queue
      const jobs = this._queue.items
      const queueIndex = jobs.findIndex((jobInfoQueued) => jobInfoQueued.uuid === jobUuid)
      jobs.splice(queueIndex, 1)
    }
  }

  onJobEnd(job) {
    const jobInfo = this._jobInfoByUuid[job.uuid]

    const { uuid, params, status } = jobInfo
    const { user, surveyId } = params
    const { uuid: userUuid } = user

    delete this._jobInfoByUuid[uuid]
    delete this._jobUuidByUserUuid[userUuid]
    delete this._runningJobUuidByUuid[uuid]
    delete this._runningJobUuidByUserUuid[userUuid]
    if (surveyId) {
      delete this._runningJobUuidBySurveyId[surveyId]
    } else {
      this._runningGlobalJob = false
    }

    this._logger.debug(`job ended: ${uuid} (${status}); remaining jobs: ${this._queue.size}`)

    this._startNextJob()
  }

  onJobUpdate(job) {
    // runs in main thread; can safely modify internal variables
    const { ended, status, uuid } = job
    const jobInfo = this._jobInfoByUuid[uuid]
    jobInfo.status = status
    if (ended) {
      this.onJobEnd(job)
    }
  }

  _findNextJobIndex() {
    return this._queue.items.findIndex((jobInfo) => {
      const { params } = jobInfo
      const { surveyId, user } = params ?? {}
      const { uuid: userUuid } = user
      if (this._runningJobUuidByUserUuid[userUuid]) {
        // one job per user
        return false
      }
      if (!surveyId) {
        // global jobs first
        return !this._runningGlobalJob
      }
      // one job per survey
      return !this._runningJobUuidBySurveyId[surveyId]
    })
  }

  _executeJob(jobInfo) {
    JobThreadExecutor.executeJobThread(jobInfo, this.onJobUpdate.bind(this))
  }

  _startNextJob() {
    if (this._queue.isEmpty()) {
      return false
    }
    if (Object.keys(this._runningJobUuidByUuid).length === this._maxConcurrentJobs) {
      this._logger.debug('max jobs running reached')
      return
    }
    const nextJobIndex = this._findNextJobIndex()
    if (nextJobIndex >= 0) {
      const jobInfo = this._queue.items.splice(nextJobIndex, 1)[0]
      const { uuid, params } = jobInfo
      const { surveyId, user } = params ?? {}
      const { uuid: userUuid } = user

      this._logger.debug(`starting next job: ${uuid} survey id: ${surveyId ?? ''} user uuid: ${userUuid}`)

      this._runningJobUuidByUuid[uuid] = uuid
      this._runningJobUuidByUserUuid[userUuid] = uuid
      if (surveyId) {
        this._runningJobUuidBySurveyId[surveyId] = uuid
      } else {
        this._runningGlobalJob = true
      }
      this._executeJob(jobInfo)
    }
    this._logger.debug('cannot run next job: wait for current one to complete.')
  }

  enqueue(job) {
    const { params, status, type, uuid } = job
    const jobInfo = { params, status, type, uuid }
    const { surveyId, user } = params ?? {}
    const { uuid: userUuid } = user
    if (this._runningJobUuidByUserUuid[userUuid]) {
      // only one job per user and per survey
      return false
    }
    if (!surveyId && this._runningGlobalJob) {
      // only one global job (not associated to any survey, e.g. survey creation)
      return false
    }
    this._queue.enqueue(jobInfo)
    this._jobInfoByUuid[uuid] = jobInfo
    this._jobUuidByUserUuid[userUuid] = uuid

    if (!this.isRunning()) {
      this._startNextJob()
    }
    return true
  }
}
