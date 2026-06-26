import * as R from 'ramda'

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
export const getUuid = R.prop(keys.uuid)
export const getType = R.prop(keys.type)
export const getInnerJobs = R.propOr([], keys.innerJobs)
export const getCurrentInnerJobIndex = R.propOr(-1, keys.currentInnerJobIndex)
export const getProgressPercent = R.propOr(0, keys.progressPercent)
export const getElapsedMillis = R.propOr(0, keys.elapsedMillis)
export const getTotal = R.propOr(0, keys.total)
export const getProcessed = R.propOr(0, keys.processed)

/**
 * Estimates the remaining milliseconds for a job based on elapsed time and progress.
 * Returns null when the remaining time cannot be computed (job pending, 0% progress, or already ended).
 * @param {object} job - Serialized job object.
 * @returns {number|null} Estimated remaining milliseconds, or null.
 */
export const getRemainingMillis = (job) => {
  const progress = getProgressPercent(job)
  if (progress <= 0 || isEnded(job)) return null
  return Math.round((getElapsedMillis(job) / progress) * (100 - progress))
}

export const getResult = R.prop(keys.result)
export const getErrors = (job) => {
  const errors = R.propOr([], keys.errors, job)
  // If errors is empty, get errors from failed inner job (if any)
  return R.isEmpty(errors) ? R.pipe(getInnerJobs, R.find(isFailed), R.propOr([], keys.errors))(job) : errors
}
export const getErrorsCount = (job) => Object.keys(getErrors(job)).length
export const hasErrors = (job) => getErrorsCount(job) > 0

// ===== READ (status)
export const getStatus = R.prop(keys.status)

const _isPropTrue = (prop) => R.pipe(R.prop(prop), R.equals(true))
export const isPending = _isPropTrue(keys.pending)
export const isRunning = _isPropTrue(keys.running)
export const isSucceeded = _isPropTrue(keys.succeeded)
export const isFailed = _isPropTrue(keys.failed)
export const isEnded = _isPropTrue(keys.ended)
export const isCanceled = _isPropTrue(keys.canceled)
