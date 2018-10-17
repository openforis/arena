import * as R from 'ramda'

const activeJob = 'activeJob'

export const getSurveyActiveJob = R.prop(activeJob)

export const updateSurveyActiveJob = job =>
  job
    ? R.assoc(activeJob, job)
    : R.dissoc(activeJob)
