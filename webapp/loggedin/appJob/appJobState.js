import * as R from 'ramda'

import * as AppState from '../../app/appState'

export const stateKey = 'job'

export const keys = {
  activeJob: 'activeJob',
  onComplete: 'onComplete',
}

export const getActiveJob = R.pipe(AppState.getState, R.propOr(null, keys.activeJob))

export const startJob = (job, onComplete = null, autoHide = false) =>
  R.assoc(
    keys.activeJob,
    { ...job, onComplete, autoHide }
  )

export const updateActiveJob = job =>
  state => job
    ? R.assoc(
      keys.activeJob,
      R.mergeRight(R.prop(keys.activeJob)(state), job)
    )(state)
    : R.dissoc(keys.activeJob)(state)

export const getActiveJobOnCompleteCallback = R.pipe(getActiveJob, R.defaultTo({}), R.propOr(null, keys.onComplete))

