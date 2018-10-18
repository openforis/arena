import * as R from 'ramda'

const activeJob = 'activeJob'

export const getActiveJob = R.path(['app', activeJob])

export const updateActiveJob = job =>
  job
    ? R.assoc(activeJob, job)
    : R.dissoc(activeJob)
