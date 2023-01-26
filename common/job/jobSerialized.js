import * as R from 'ramda'

export const keys = {
  type: 'type',
  userUuid: 'userUuid',
  surveyId: 'surveyId',
  innerJobs: 'innerJobs',

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
export const getType = R.prop(keys.type)
export const getInnerJobs = R.propOr([], keys.innerJobs)
export const getProgressPercent = R.propOr(0, keys.progressPercent)
export const getResult = R.prop(keys.result)
export const getErrors = (job) => {
  const errors = R.propOr([], keys.errors, job)
  // If errors is empty, get errors from failed inner job (if any)
  return R.isEmpty(errors) ? R.pipe(getInnerJobs, R.find(isFailed), R.propOr([], keys.errors))(job) : errors
}
export const hasErrors = (job) => !R.isEmpty(getErrors(job))

// ===== READ (status)
export const getStatus = R.prop(keys.status)

const _isPropTrue = (prop) => R.pipe(R.prop(prop), R.equals(true))
export const isRunning = _isPropTrue(keys.running)
export const isSucceeded = _isPropTrue(keys.succeeded)
export const isFailed = _isPropTrue(keys.failed)
export const isEnded = _isPropTrue(keys.ended)
export const isCanceled = _isPropTrue(keys.canceled)
