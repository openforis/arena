import * as R from 'ramda'

export const stateKey = 'appJob'

const getState = R.propOr({}, stateKey)

export const keys = {
  activeJob: 'activeJob',
  onComplete: 'onComplete',
}

export const getActiveJob = R.pipe(getState, R.propOr(null, keys.activeJob))

export const startJob = (job, onComplete = null, autoHide = false) => R.assoc(
  keys.activeJob,
  {...job, onComplete, autoHide}
)

export const updateActiveJob = job => state =>
  job
    ? R.assoc(
      keys.activeJob,
      {
        ...R.propOr({}, keys.activeJob, state),
        ...job
      }
    )(state)
    : R.dissoc(keys.activeJob)(state)

export const getActiveJobOnCompleteCallback = R.pipe(getActiveJob, R.propOr(null, keys.onComplete))

