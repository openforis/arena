import { Objects } from '@openforis/arena-core'
import { JobRepository, WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import * as Log from '@server/log/log'

import * as JobThreadExecutor from './jobThreadExecutor'
import { jobStatus } from './jobUtils'

const defaultConfiguration = {
  concurrency: 3,
}

export class JobQueue {
  constructor(configuration = defaultConfiguration) {
    const { concurrency } = { ...defaultConfiguration, ...configuration }

    this._logger = Log.getLogger('JobQueue')

    this._queue = []

    this._maxConcurrentJobs = concurrency

    this._runningGlobalJob = false
    this._jobInfoByUuid = {} // all jobs (running or queued)
    this._jobUuidByUserUuid = {} // jobs per user (running or queued)
    this._runningJobUuidByUuid = {} // running jobs
    this._runningJobUuidBySurveyId = {} // running jobs by survey id
    this._runningJobUuidByUserUuid = {} // running jobs by user uuid
    this._startNextJobChain = Promise.resolve() // serializes _startNextJob traversals; see _startNextJob

    this._logger.debug(`initializing job queue with ${concurrency} max concurrent jobs`)
  }

  isRunning() {
    return Objects.isNotEmpty(this._runningJobUuidByUuid)
  }

  _getJobInfoByUserUuid(userUuid) {
    const jobUuid = this._jobUuidByUserUuid[userUuid]
    return this._jobInfoByUuid[jobUuid]
  }

  getJobSummary(jobUuid) {
    const jobInfo = this._jobInfoByUuid[jobUuid]
    if (!jobInfo) return null
    const { params } = jobInfo
    const { user } = params
    const { uuid: userUuid } = user
    if (this._runningJobUuidByUserUuid[userUuid]) {
      return JobThreadExecutor.getActiveJobSummary(userUuid)
    } else {
      return jobInfo
    }
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

  deleteJobInfo({ jobUuid }) {
    const $this = this
    // delay job info canceling; give time to clients to fetch the updated job
    setTimeout(() => {
      delete $this._jobInfoByUuid[jobUuid]
    }, 60000)
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
      this.deleteJobInfo({ jobUuid })
      delete this._jobUuidByUserUuid[userUuid]
    }
  }

  onJobEnd(job) {
    const jobInfo = this._jobInfoByUuid[job.uuid]

    const { uuid, params, status } = jobInfo
    const { user, surveyId } = params
    const { uuid: userUuid } = user

    this.deleteJobInfo({ jobUuid: uuid })
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
      } else if (!this._runningJobUuidBySurveyId[surveyId] && firstSurveyJobIndex < 0) {
        // one job per survey
        firstSurveyJobIndex = index
      }
      return firstGlobalJobIndex >= 0
    })
    return !this._runningGlobalJob && firstGlobalJobIndex >= 0 ? firstGlobalJobIndex : firstSurveyJobIndex
  }

  _executeJob(jobInfo) {
    JobThreadExecutor.executeJobThread(jobInfo, this.onJobUpdate.bind(this))
  }

  async _hasActiveJobElsewhere({ uuid, userUuid, surveyId }) {
    const activeByUser = await JobRepository.getActiveByUserUuid(userUuid).catch((error) => {
      this._logger.error(`error checking active job by user: ${error}`)
      return null
    })
    if (activeByUser && activeByUser.uuid !== uuid) return true

    if (surveyId) {
      const activeBySurvey = await JobRepository.getActiveBySurveyId(surveyId).catch((error) => {
        this._logger.error(`error checking active job by survey: ${error}`)
        return null
      })
      if (activeBySurvey && activeBySurvey.uuid !== uuid) return true
    }
    return false
  }

  async _failQueuedJob({ jobInfo, message }) {
    const { uuid, params } = jobInfo
    const { user, surveyId } = params ?? {}
    const { uuid: userUuid } = user

    jobInfo.status = jobStatus.failed
    this.deleteJobInfo({ jobUuid: uuid })
    delete this._jobUuidByUserUuid[userUuid]

    if (surveyId) {
      await JobRepository.updateStatus({
        uuid,
        status: jobStatus.failed,
        props: { errors: { generic: { key: 'appErrors:generic', params: { text: message } } } },
      }).catch((error) => this._logger.error(`error persisting failed status for job ${uuid}: ${error}`))
    }

    WebSocketServer.notifyUser(userUuid, WebSocketEvent.jobUpdate, jobInfo)
  }

  // Public entry point: serializes concurrent external triggers (enqueue(), onJobEnd())
  // so at most one logical traversal of the queue is ever in flight. Each external call
  // chains onto whatever traversal is currently running (or starts a fresh one). Call
  // sites intentionally do NOT await this (fire-and-forget).
  // Note: cancelJobByUserUuid()/destroy() mutate this._queue directly and are NOT
  // routed through this chain - that's exactly why _startNextJobInternal re-resolves a
  // job's position by object identity (this._queue.indexOf(jobInfo)) after its await,
  // instead of trusting a numeric index computed before the await.
  _startNextJob() {
    this._startNextJobChain = (this._startNextJobChain || Promise.resolve())
      .then(() => this._startNextJobInternal())
      .catch((error) => this._logger.error(`error in job queue loop: ${error}`))
    return this._startNextJobChain
  }

  // Recursive draining of the queue for a single triggered traversal. This recurses
  // into itself directly (NOT via _startNextJob()) so that a full drain resolves as one
  // unit and the chain above only advances to the next external caller once this
  // traversal has completely finished. Recursing through _startNextJob() instead would
  // re-read this._startNextJobChain while it still points at this very call, creating a
  // circular promise dependency that deadlocks the queue after the first job (verified
  // via isolated repro during development - see task-4-report.md).
  async _startNextJobInternal() {
    if (this._queue.length === 0) {
      return false
    }
    if (Object.keys(this._runningJobUuidByUuid).length === this._maxConcurrentJobs) {
      this._logger.debug('max jobs running reached')
      return
    }
    const nextJobIndex = this._findNextJobIndex()
    if (nextJobIndex >= 0) {
      const jobInfo = this._queue[nextJobIndex]
      const { uuid, params } = jobInfo
      const { surveyId, user } = params ?? {}
      const { uuid: userUuid } = user

      const conflictsElsewhere = await this._hasActiveJobElsewhere({ uuid, userUuid, surveyId })

      const currentIndex = this._queue.indexOf(jobInfo)
      if (currentIndex < 0) {
        // jobInfo was removed from the queue while the cluster-wide check was in flight
        // (e.g. cancelled via cancelJobByUserUuid, which mutates the queue directly and
        // is not routed through _startNextJob's serialization chain) - nothing to do for
        // this job, move on to whatever's next.
        return this._startNextJobInternal()
      }

      if (conflictsElsewhere) {
        this._logger.debug(`job ${uuid} conflicts with an active job on another dyno; failing it`)
        this._queue.splice(currentIndex, 1)
        await this._failQueuedJob({ jobInfo, message: 'Another job is already running for this user or survey' })
        return this._startNextJobInternal()
      }

      this._queue.splice(currentIndex, 1)

      this._logger.debug(`starting next job: ${uuid} survey id: ${surveyId ?? ''} user uuid: ${userUuid}`)

      this._runningJobUuidByUuid[uuid] = uuid
      this._runningJobUuidByUserUuid[userUuid] = uuid
      if (surveyId) {
        this._runningJobUuidBySurveyId[surveyId] = uuid
      } else {
        this._runningGlobalJob = true
      }
      this._executeJob(jobInfo)

      return this._startNextJobInternal()
    } else {
      this._logger.debug('cannot run next job: wait for current one to complete.')
    }
  }

  enqueue(job) {
    const { params, status, type, uuid } = job
    const jobInfo = { params, status, type, uuid }
    const { user, surveyId } = params ?? {}
    const { uuid: userUuid } = user

    const existingJobUuid = this._jobUuidByUserUuid[userUuid]
    if (existingJobUuid) {
      // Only one job per user and per survey (queued or running) - matches this
      // dyno's existing behavior of letting a user have concurrently outstanding
      // jobs for different surveys (see 'global jobs executed before survey ones'
      // test), while synchronously rejecting a same-survey duplicate immediately,
      // without waiting on the cluster-wide _hasActiveJobElsewhere DB check (which
      // still applies at job-start time regardless, as the authoritative guard).
      const existingJobInfo = this._jobInfoByUuid[existingJobUuid]
      const existingSurveyId = existingJobInfo?.params?.surveyId
      if (existingSurveyId === surveyId || existingSurveyId === undefined || surveyId === undefined) {
        // a global job (no surveyId) always conflicts with anything else for this user:
        // global jobs are never persisted to the job table (survey_id is NOT NULL), so
        // _hasActiveJobElsewhere's cluster-wide DB check has no row to find and can't
        // catch this case either - this same-dyno guard is the only backstop for it.
        throw new Error('Only one job per user can run at a time')
      }
    }
    this._logger.debug(`enqueuing job ${type} (${uuid})`)

    this._queue.push(jobInfo)
    this._jobInfoByUuid[uuid] = jobInfo
    this._jobUuidByUserUuid[userUuid] = uuid

    if (surveyId) {
      // Fire-and-forget: makes the job pollable from any dyno via JobManager.getJobSummary/getActiveJobSummary.
      // Not persisted for global (no-surveyId) jobs - the job table's survey_id column is NOT NULL.
      JobRepository.insert({ uuid, userUuid, surveyId, type }).catch((error) =>
        this._logger.error(`error persisting job ${uuid}: ${error}`)
      )
    }

    this._startNextJob()
  }

  async destroy() {
    for (const userUuid of Object.keys(this._jobUuidByUserUuid)) {
      await this.cancelJobByUserUuid(userUuid)
    }
  }
}
