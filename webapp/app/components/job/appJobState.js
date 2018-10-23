import * as R from 'ramda'

const activeJob = 'activeJob'

export const getActiveJob = R.pathOr(null, ['app', activeJob])

export const updateActiveJob = (job, closeAutomatically = false) =>
  state =>
    job
      ?
      R.pipe(
        R.assoc('closeAutomatically', closeAutomatically),
        j => R.assoc(activeJob, j)(state)
      )(job)
      :
      R.dissoc(activeJob)(state)
