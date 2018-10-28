import * as R from 'ramda'

const info = "info"

// export const getSurveyInfo =

export const assocSurveyInfo = survey => R.assoc(info, survey.info)