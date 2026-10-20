import * as A from '@core/arena'

export const keys = {
  type: 'type',
  uuid: 'uuid',
  userUuid: 'userUuid',
  surveyId: 'surveyId',
  innerJobs: 'innerJobs',
  currentInnerJobIndex: 'currentInnerJobIndex',

  // Status
  status: 'status',
  pending: 'pending',
  running: 'running',
  succeeded: 'succeeded',
  canceled: 'canceled',
  canceledByAdmin: 'canceledByAdmin',
  failed: 'failed',
  ended: 'ended',

  // Progress
  total: 'total',
  processed: 'processed',
  progressPercent: 'progressPercent',
  elapsedMillis: 'elapsedMillis',

  // Output
  errors: 'errors',
  result: 'result',
}

// ===== READ
export const getUuid = A.prop(keys.uuid)
export const getType = A.prop(keys.type)
export const getInnerJobs = A.propOr([], keys.innerJobs)
export const getCurrentInnerJobIndex = A.propOr(-1, keys.currentInnerJobIndex)
export const getProgressPercent = A.propOr(0, keys.progressPercent)
export const getElapsedMillis = A.propOr(0, keys.elapsedMillis)
export const getTotal = A.propOr(0, keys.total)
export const getProcessed = A.propOr(0, keys.processed)

/**
 * Estimates the remaining milliseconds for a job based on elapsed time and progress.
 *
 * When the job has inner jobs, the estimate accounts for:
 * - the remaining time of the currently running inner job (recursively)
 * - the expected duration of each not-yet-started inner job, derived from the
 *   average elapsed time of already-completed inner jobs (or from the current
 *   inner job's rate when no completed ones exist yet)
 *
 * Returns null when remaining time cannot be computed (0% progress, already ended).
 * @param {object} job - Serialized job object.
 * @returns {number|null} Estimated remaining milliseconds, or null.
 */
export const getRemainingMillis = (job) => {
  const progress = Math.min(100, Math.max(0, getProgressPercent(job)))
  if (progress <= 0 || isEnded(job)) return null

  const simpleEstimate = Math.round((getElapsedMillis(job) / progress) * (100 - progress))

  const innerJobs = getInnerJobs(job)
  const currentInnerJobIndex = getCurrentInnerJobIndex(job)

  if (innerJobs.length === 0 || currentInnerJobIndex < 0) return simpleEstimate

  const runningInnerJob = innerJobs[currentInnerJobIndex]
  if (!isRunning(runningInnerJob)) return simpleEstimate

  const innerRemaining = getRemainingMillis(runningInnerJob)

  // Average duration of inner jobs that have already finished
  const completedInnerJobs = innerJobs.slice(0, currentInnerJobIndex)
  let avgInnerJobDuration = null

  if (completedInnerJobs.length > 0) {
    const totalDuration = completedInnerJobs.reduce((sum, j) => sum + getElapsedMillis(j), 0)
    avgInnerJobDuration = totalDuration / completedInnerJobs.length
  } else if (innerRemaining !== null) {
    // No completed jobs yet — project the current inner job's rate to a full duration
    const innerProgress = getProgressPercent(runningInnerJob)
    const innerElapsed = getElapsedMillis(runningInnerJob)
    if (innerProgress > 0) {
      avgInnerJobDuration = Math.round((innerElapsed / innerProgress) * 100)
    }
  }

  if (innerRemaining === null && avgInnerJobDuration === null) return simpleEstimate

  const remainingJobsAfterCurrent = innerJobs.length - currentInnerJobIndex - 1
  // If current job's remaining is unknown, fall back to the avg duration as its estimate
  const currentJobRemaining = innerRemaining ?? avgInnerJobDuration ?? 0
  const futureJobsEstimate = remainingJobsAfterCurrent * (avgInnerJobDuration ?? 0)

  return Math.round(currentJobRemaining + futureJobsEstimate)
}

export const getResult = A.prop(keys.result)
export const getErrors = (job) => {
  const errors = A.propOr([], keys.errors, job)
  // If errors is empty, get errors from failed inner job (if any)
  return A.isEmpty(errors) ? A.pipe(getInnerJobs, A.find(isFailed), A.propOr([], keys.errors))(job) : errors
}
export const getErrorsCount = (job) => Object.keys(getErrors(job)).length
export const hasErrors = (job) => getErrorsCount(job) > 0

// ===== READ (status)
export const getStatus = A.prop(keys.status)

const _isPropTrue = (prop) => A.pipe(A.prop(prop), A.equals(true))
export const isPending = _isPropTrue(keys.pending)
export const isRunning = _isPropTrue(keys.running)
export const isSucceeded = _isPropTrue(keys.succeeded)
export const isFailed = _isPropTrue(keys.failed)
export const isEnded = _isPropTrue(keys.ended)
export const isCanceled = _isPropTrue(keys.canceled)
export const isCanceledByAdmin = _isPropTrue(keys.canceledByAdmin)
