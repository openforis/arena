import { Objects } from '@openforis/arena-core'

import * as Log from '@server/log/log'

import * as JobThreadExecutor from './jobThreadExecutor'

export class JobQueue {
  constructor() {
    this._logger = Log.getLogger('JobQueue')

    this._queue = []

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
    if (this._runningJobUuidByUserUuid[userUuid]) {
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
      const queueIndex = this._queue.findIndex((jobInfoQueued) => jobInfoQueued.uuid === jobUuid)
      this._queue.splice(queueIndex, 1)
      delete this._jobUuidByUserUuid[userUuid]
      delete this._jobInfoByUuid[jobUuid]
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

    this._logger.debug(`job ended: ${uuid} (${status}); remaining jobs: ${this._queue.length}`)

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
    let firstGlobalJobIndex = -1
    let firstSurveyJobIndex = -1
    this._queue.some((jobInfo, index) => {
      const { params } = jobInfo
      const { surveyId } = params ?? {}
      if (!surveyId) {
        // global jobs first
        if (!this._runningGlobalJob && firstGlobalJobIndex < 0) {
          firstGlobalJobIndex = index
        }
      } else {
        // one job per survey
        if (!this._runningJobUuidBySurveyId[surveyId] && firstSurveyJobIndex < 0) {
          firstSurveyJobIndex = index
        }
      }
      return firstGlobalJobIndex >= 0
    })
    return !this._runningGlobalJob && firstGlobalJobIndex >= 0 ? firstGlobalJobIndex : firstSurveyJobIndex
  }

  _executeJob(jobInfo) {
    JobThreadExecutor.executeJobThread(jobInfo, this.onJobUpdate.bind(this))
  }

  _startNextJob() {
    if (this._queue.length === 0) {
      return false
    }
    if (Object.keys(this._runningJobUuidByUuid).length === this._maxConcurrentJobs) {
      this._logger.debug('max jobs running reached')
      return
    }
    const nextJobIndex = this._findNextJobIndex()
    if (nextJobIndex >= 0) {
      const jobInfo = this._queue.splice(nextJobIndex, 1)[0]
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

      this._startNextJob()
    } else {
      this._logger.debug('cannot run next job: wait for current one to complete.')
    }
  }

  enqueue(job) {
    const { params, status, type, uuid } = job
    const jobInfo = { params, status, type, uuid }
    const { user } = params ?? {}
    const { uuid: userUuid } = user

    if (this._runningJobUuidByUserUuid[userUuid]) {
      // only one job per user and per survey
      throw new Error('Only one job per user can run at a time')
    }
    this._logger.debug(`enqueuing job ${type} (${uuid})`)

    this._queue.push(jobInfo)
    this._jobInfoByUuid[uuid] = jobInfo
    this._jobUuidByUserUuid[userUuid] = uuid

    this._startNextJob()
  }

  async destroy() {
    for await (const userUuid of Object.keys(this._jobUuidByUserUuid)) {
      await this.cancelJobByUserUuid(userUuid)
    }
  }
}
