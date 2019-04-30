import * as R from 'ramda'

import * as AppState from '../../app/appState'

const activeJob = 'activeJob'

export const getActiveJob = R.pipe(AppState.getState, R.propOr(null, activeJob))

export const startJob = (job, onComplete = null, autoHide = false) =>
  R.assoc(activeJob, {
    ...job,
    onComplete,
    autoHide,
  })

export const updateActiveJob = job => state =>
  job
    ? (
      R.pipe(
        R.prop(activeJob),
        activeJob => ({
          ...activeJob,
          ...job,
        }),
        actJob => R.assoc(activeJob, actJob)(state)
      )(state)
    )
    : (
      R.dissoc(activeJob)(state)
    )

export const getActiveJobOnCompleteCallback = R.propOr(null, 'onComplete')