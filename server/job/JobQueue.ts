import { JobStatus, Objects, User } from '@openforis/arena-core'
import { JobRepository, JobRow, WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import * as Log from '@server/log/log'

import * as JobThreadExecutor from './jobThreadExecutor'
import { jobRowToSummary } from './jobUtils'

type JobParams = {
  user: User
  surveyId?: number
  [key: string]: any
}

type JobInfo = {
  uuid: string
  type: string
  status: JobStatus
  params: JobParams
  persistPromise?: Promise<JobRow | void>
  ended?: boolean
}

type ActiveJobRow = {
  uuid: string
  [key: string]: any
}

type JobQueueConfig = {
  concurrency?: number
}

interface Logger {
  debug(msg: string): void
  error(msg: string): void
}

/**
 * JobQueue manages enqueueing and executing jobs with concurrency control.
 * Handles job scheduling, conflict detection, and status management across dynos.
 */
export class JobQueue {
  private readonly _logger: Logger
  private readonly _queue: JobInfo[] = []
  private readonly _maxConcurrentJobs: number
  private _runningGlobalJob: boolean = false
  private readonly _jobInfoByUuid: Record<string, JobInfo> = {}
  private readonly _jobUuidsByUserUuid: Record<string, Set<string>> = {}
  private readonly _runningJobUuidByUuid: Record<string, string> = {}
  private readonly _runningJobUuidBySurveyId: Record<string, string> = {}
  private readonly _runningJobUuidByUserUuid: Record<string, string> = {}
  private _startNextJobChain: Promise<boolean | void> | null = null

  constructor(configuration: JobQueueConfig = {}) {
    const defaultConfiguration: JobQueueConfig = { concurrency: 3 }
    const { concurrency } = { ...defaultConfiguration, ...configuration }

    this._logger = Log.getLogger('JobQueue')
    this._maxConcurrentJobs = concurrency ?? 3

    this._logger.debug(`initializing job queue with ${this._maxConcurrentJobs} max concurrent jobs`)
  }

  /**
   * Checks if any jobs are currently running.
   * @returns True if there are running jobs.
   */
  isRunning(): boolean {
    return Objects.isNotEmpty(this._runningJobUuidByUuid)
  }

  /**
   * Picks a representative job for this user: the running one if there is one, otherwise the
   * first (oldest) queued one. Used only for the "does this user have anything outstanding at
   * all, and what does it look like" queries below - a user with multiple outstanding jobs is an
   * inherently lossy case for these (the webapp's job monitor only ever shows one job at a time).
   *
   * @param userUuid - The user UUID.
   * @returns Job info for the user or null if none exists.
   */
  private _getJobInfoByUserUuid(userUuid: string): JobInfo | null {
    const jobUuids = this._jobUuidsByUserUuid[userUuid]
    if (!jobUuids || jobUuids.size === 0) return null
    const runningUuid = this._runningJobUuidByUserUuid[userUuid]
    const targetUuid = runningUuid && jobUuids.has(runningUuid) ? runningUuid : jobUuids.values().next().value
    return this._jobInfoByUuid[targetUuid]
  }

  /**
   * Removes a single job uuid from a user's outstanding-jobs set, cleaning up the set entirely
   * once it's empty. Shared by onJobEnd and _failQueuedJob.
   *
   * @param params - Object containing userUuid and job uuid.
   */
  private _removeJobUuidForUser({ userUuid, uuid }: { userUuid: string; uuid: string }): void {
    const jobUuids = this._jobUuidsByUserUuid[userUuid]
    if (!jobUuids) return
    jobUuids.delete(uuid)
    if (jobUuids.size === 0) {
      delete this._jobUuidsByUserUuid[userUuid]
    }
  }

  /**
   * Get the summary for a specific job.
   * @param jobUuid - The job UUID.
   * @returns Job summary or null if not found.
   */
  getJobSummary(jobUuid: string): JobInfo | null {
    const jobInfo = this._jobInfoByUuid[jobUuid]
    if (!jobInfo) return null
    const { params } = jobInfo
    const { user } = params
    const { uuid: userUuid } = user
    if (this._runningJobUuidByUserUuid[userUuid] === jobUuid) {
      return JobThreadExecutor.getActiveJobSummary(userUuid)
    } else {
      return jobInfo
    }
  }

  /**
   * Get the running job summary for a specific user.
   * @param userUuid - The user UUID.
   * @returns Job summary or null if user has no running jobs.
   */
  getRunningJobSummaryByUserUuid(userUuid: string): JobInfo | null {
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

  /**
   * Delete job info after a delay to give clients time to fetch updated status.
   * @param jobUuid - The job UUID.
   */
  private deleteJobInfo({ jobUuid }: { jobUuid: string }): void {
    // delay job info canceling; give time to clients to fetch the updated job
    setTimeout(() => {
      delete this._jobInfoByUuid[jobUuid]
    }, 60000)
  }

  /**
   * Cancels ALL of this user's outstanding jobs (queued and/or running), not just one. The
   * webapp's cancel action (DELETE /jobs/active) has no concept of "which job" - it's a single
   * userUuid-scoped call with no jobUuid - so the safest interpretation once a user can have
   * multiple concurrently outstanding jobs (different surveys) is to clear all of them, rather
   * than leaving an invisible one behind that the current UI has no way to see or separately
   * cancel. NOTE: this mutates this._queue/this._jobUuidsByUserUuid directly and synchronously
   * and is NOT routed through _startNextJob's serialization chain - see _startNextJobInternal's
   * identity-based (indexOf) re-resolution, which exists specifically to stay correct in the
   * face of that.
   *
   * @param userUuid - The user UUID.
   */
  async cancelJobByUserUuid(userUuid: string): Promise<void> {
    const jobUuids = this._jobUuidsByUserUuid[userUuid]
    if (!jobUuids || jobUuids.size === 0) return

    const runningJobUuid = this._runningJobUuidByUserUuid[userUuid]

    for (const jobUuid of jobUuids) {
      if (jobUuid === runningJobUuid) {
        // cancel job thread; actual bookkeeping cleanup happens later via onJobEnd once the
        // thread acknowledges the cancellation
        await JobThreadExecutor.cancelActiveJobByUserUuid(userUuid)
      } else {
        // remove queued job from the queue directly
        const queueIndex = this._queue.findIndex((jobInfoQueued) => jobInfoQueued.uuid === jobUuid)
        if (queueIndex >= 0) {
          this._queue.splice(queueIndex, 1)
        }
        const queuedJobInfo = this._jobInfoByUuid[jobUuid]
        const queuedJobSurveyId = queuedJobInfo?.params?.surveyId
        if (queuedJobSurveyId) {
          // without this, the row is left at 'pending' forever (until the stale-job reaper
          // eventually reaps it), blocking this user/survey cluster-wide in the meantime -
          // same reasoning as _failQueuedJob's persisted status write
          await JobRepository.updateStatus({ uuid: jobUuid, status: JobStatus.canceled }).catch((error) =>
            this._logger.error(`error persisting canceled status for job ${jobUuid}: ${error}`)
          )
        }
        this.deleteJobInfo({ jobUuid })
        this._removeJobUuidForUser({ userUuid, uuid: jobUuid })
      }
    }
  }

  /**
   * Callback when a job ends.
   * @param job - The job object.
   */
  onJobEnd(job: JobInfo): void {
    const jobInfo = this._jobInfoByUuid[job.uuid]

    const { uuid, params, status } = jobInfo
    const { user, surveyId } = params
    const { uuid: userUuid } = user

    this.deleteJobInfo({ jobUuid: uuid })
    this._removeJobUuidForUser({ userUuid, uuid })
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

  /**
   * Callback when a job updates its status.
   * @param job - The job object.
   */
  onJobUpdate(job: JobInfo): void {
    // runs in main thread; can safely modify internal variables
    const { ended, status, uuid } = job
    const jobInfo = this._jobInfoByUuid[uuid]
    jobInfo.status = status
    if (ended) {
      this.onJobEnd(job)
    }
  }

  /**
   * Find the index of the next job to execute.
   * @returns The index of the next job or -1 if none available.
   */
  private _findNextJobIndex(): number {
    let firstGlobalJobIndex = -1
    let firstSurveyJobIndex = -1
    this._queue.some((jobInfo, index) => {
      const { params } = jobInfo
      const { surveyId, user } = params ?? {}
      const { uuid: userUuid } = user ?? {}
      if (this._runningJobUuidByUserUuid[userUuid]) {
        // this user already has a job running on this dyno - skip, regardless of survey (a
        // second job for the same user can't be promoted to running until the first ends; this
        // is what keeps jobThreadExecutor's userUuid-keyed caches, which only ever support one
        // entry per user, safe even though a user can have jobs for multiple surveys queued)
        return false
      }
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

  /**
   * Execute a job thread.
   * @param jobInfo - The job info.
   */
  private _executeJob(jobInfo: JobInfo): void {
    JobThreadExecutor.executeJobThread(jobInfo, this.onJobUpdate.bind(this))
  }

  /**
   * Check if there's an active job elsewhere for this user or survey.
   * @param params - Object with uuid, userUuid, and optional surveyId.
   * @returns True if there's a conflicting active job elsewhere.
   */
  private async _hasActiveJobElsewhere({
    uuid,
    userUuid,
    surveyId,
  }: {
    uuid: string
    userUuid: string
    surveyId?: number
  }): Promise<boolean> {
    // A DB row is only a real conflict if it belongs to a job THIS dyno has never heard of - if
    // this dyno already tracks the row's uuid (this._jobInfoByUuid), its own local state is more
    // current than a possibly-stale DB read: onJobEnd() frees local locks synchronously the
    // moment a job's thread posts its terminal update, but the DB write for that same terminal
    // status goes through jobThreadExecutor's 500ms per-job throttle, so there's a real window
    // (routinely up to 500ms) where a job has locally ended but its DB row still says 'running'.
    // Without this check, a same-dyno successor job queued right behind it would see that stale
    // row and be failed for a conflict that already resolved on this exact dyno.
    // deleteJobInfo's existing 60-second delayed cleanup conveniently keeps a just-ended job
    // visible in _jobInfoByUuid for exactly the window that matters here.
    const isConflict = (activeJob: ActiveJobRow | null): boolean =>
      Boolean(activeJob) && activeJob!.uuid !== uuid && !this._jobInfoByUuid[activeJob!.uuid]

    const activeByUser = await JobRepository.getActiveByUserUuid(userUuid).catch((error) => {
      this._logger.error(`error checking active job by user: ${error}`)
      return null
    })
    if (isConflict(activeByUser)) return true

    if (surveyId) {
      const activeBySurvey = await JobRepository.getActiveBySurveyId(surveyId).catch((error) => {
        this._logger.error(`error checking active job by survey: ${error}`)
        return null
      })
      if (isConflict(activeBySurvey)) return true
    }
    return false
  }

  /**
   * Fail a queued job.
   * @param params - Object with jobInfo and error message.
   */
  private async _failQueuedJob({ jobInfo, message }: { jobInfo: JobInfo; message: string }): Promise<void> {
    const { uuid, type, params } = jobInfo
    const { user, surveyId } = params ?? {}
    const { uuid: userUuid } = user

    const errors = { generic: { key: 'appErrors:generic', params: { text: message } } }

    jobInfo.status = JobStatus.failed
    this.deleteJobInfo({ jobUuid: uuid })
    this._removeJobUuidForUser({ userUuid, uuid })

    if (surveyId) {
      await JobRepository.updateStatus({
        uuid,
        status: JobStatus.failed,
        props: { errors },
      }).catch((error) => this._logger.error(`error persisting failed status for job ${uuid}: ${error}`))
    }

    // Build a proper job summary (not the raw internal jobInfo, which lacks ended/failed/
    // progressPercent/etc. and leaks the full params object including user) - the webapp's job
    // monitor gates on those flags, so sending raw jobInfo left the dialog stuck showing
    // pending/not-ended forever. Reuse jobRowToSummary against a synthetic "row" for a shape
    // that's guaranteed identical to every other jobUpdate this app sends.
    const now = new Date()
    const summary = jobRowToSummary({
      uuid,
      userUuid,
      surveyId,
      type,
      status: JobStatus.failed,
      processed: 0,
      total: 0,
      props: { errors },
      dateCreated: now,
      dateModified: now,
    })

    WebSocketServer.notifyUser(userUuid, WebSocketEvent.jobUpdate, summary)
  }

  /**
   * Public entry point: serializes concurrent external triggers (enqueue(), onJobEnd())
   * so at most one logical traversal of the queue is ever in flight. Each external call
   * chains onto whatever traversal is currently running (or starts a fresh one). Call
   * sites intentionally do NOT await this (fire-and-forget).
   * Note: cancelJobByUserUuid()/destroy() mutate this._queue directly and are NOT
   * routed through this chain - that's exactly why _startNextJobInternal re-resolves a
   * job's position by object identity (this._queue.indexOf(jobInfo)) after its await,
   * instead of trusting a numeric index computed before the await.
   */
  private _startNextJob(): void {
    this._startNextJobChain = (this._startNextJobChain || Promise.resolve())
      .then(() => this._startNextJobInternal())
      .catch((error) => this._logger.error(`error in job queue loop: ${error}`))
  }

  /**
   * Recursive draining of the queue for a single triggered traversal. This recurses
   * into itself directly (NOT via _startNextJob()) so that a full drain resolves as one
   * unit and the chain above only advances to the next external caller once this
   * traversal has completely finished. Recursing through _startNextJob() instead would
   * re-read this._startNextJobChain while it still points at this very call, creating a
   * circular promise dependency that deadlocks the queue after the first job (verified
   * via isolated repro during development - see task-4-report.md).
   */
  private async _startNextJobInternal(): Promise<boolean | void> {
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

      if (jobInfo.persistPromise !== undefined) {
        // Wait for enqueue()'s fire-and-forget INSERT to land before this job's status/progress
        // can ever be persisted. Without this, a very fast job's terminal UPDATE (issued once
        // _executeJob below actually starts the job) could reach the DB before the INSERT
        // commits - updateStatus is an UPDATE ... RETURNING, so it throws (caught and logged)
        // when the row doesn't exist yet, and the INSERT landing afterward would leave the job
        // permanently stuck at 'pending' with no later write ever correcting it.
        await jobInfo.persistPromise
      }

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
        await this._failQueuedJob({
          jobInfo,
          message: 'Another job is already running for this user or survey',
        })
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

  /**
   * Enqueue a job for execution.
   * @param job - The job to enqueue.
   * @throws Error if only one job per user is already running.
   */
  enqueue(job: JobInfo): void {
    const { params, status, type, uuid } = job
    const jobInfo: JobInfo = { params, status, type, uuid }
    const { user, surveyId } = params ?? {}
    const { uuid: userUuid } = user

    const existingJobUuids = this._jobUuidsByUserUuid[userUuid]
    if (existingJobUuids && existingJobUuids.size > 0) {
      const hasConflict = [...existingJobUuids].some((existingUuid) => {
        // Only one job per user and per survey (queued or running) - matches this dyno's
        // existing behavior of letting a user have concurrently outstanding jobs for different
        // surveys (see 'global jobs executed before survey ones' test), while synchronously
        // rejecting a same-survey duplicate immediately, without waiting on the cluster-wide
        // _hasActiveJobElsewhere DB check (which still applies at job-start time regardless, as
        // the authoritative guard). A global job (no surveyId) always conflicts with anything
        // else for this user, in either direction: global jobs are never persisted to the job
        // table (survey_id is NOT NULL), so _hasActiveJobElsewhere's cluster-wide DB check has no
        // row to find and can't catch that combination either - this same-dyno guard is the only
        // backstop for it.
        const existingJobInfo = this._jobInfoByUuid[existingUuid]
        const existingSurveyId = existingJobInfo?.params?.surveyId
        return existingSurveyId === surveyId || existingSurveyId === undefined || surveyId === undefined
      })
      if (hasConflict) {
        throw new Error('Only one job per user can run at a time')
      }
    }
    this._logger.debug(`enqueuing job ${type} (${uuid})`)

    this._queue.push(jobInfo)
    this._jobInfoByUuid[uuid] = jobInfo
    if (!this._jobUuidsByUserUuid[userUuid]) {
      this._jobUuidsByUserUuid[userUuid] = new Set()
    }
    this._jobUuidsByUserUuid[userUuid].add(uuid)

    if (surveyId) {
      // Fire-and-forget: makes the job pollable from any dyno via JobManager.getJobSummary/getActiveJobSummary.
      // Not persisted for global (no-surveyId) jobs - the job table's survey_id column is NOT NULL.
      // Stashed on jobInfo so _startNextJobInternal can await it before this job's first status/
      // progress write - see the comment there for why that matters.
      jobInfo.persistPromise = JobRepository.insert({ uuid, userUuid, surveyId, type }).catch((error) => {
        this._logger.error(`error persisting job ${uuid}: ${error}`)
      })
    }

    this._startNextJob()
  }

  /**
   * Destroy the job queue by cancelling all outstanding jobs.
   */
  async destroy(): Promise<void> {
    for (const userUuid of Object.keys(this._jobUuidsByUserUuid)) {
      await this.cancelJobByUserUuid(userUuid)
    }
  }
}
