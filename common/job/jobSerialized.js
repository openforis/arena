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

export const getProp = R.prop
