import * as R from 'ramda'

const activeJob = 'activeJob'

export const getActiveJob = R.pathOr(null, ['app', activeJob])

export const startJob = (job, onComplete = null, autoHide = false) =>
  R.assoc(activeJob, {
    ...job,
    onComplete,
    autoHide,
  })

export const updateActiveJob = (job) =>
  state =>
    job ?
      R.pipe(
        R.prop(activeJob),
        activeJob => ({
          ...activeJob,
          ...job,
        }),
        actJob => R.assoc(activeJob, actJob)(state)
      )(state) :
      R.dissoc(activeJob)(state)