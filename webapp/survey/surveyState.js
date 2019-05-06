import * as R from 'ramda'

import Survey from '../../common/survey/survey'

const survey = 'survey'

/**
 * ======================
 * Survey State
 * ======================
 */

// READ
export const getSurvey = R.prop(survey)

export const getSurveyInfo = R.pipe(getSurvey, Survey.getSurveyInfo)

export const getSurveyId = R.pipe(getSurvey, Survey.getId)

// STATUS
const keys = {
  status: 'status'
}

const statusKeys = {
  defsFetched: 'defsFetched',
  defsDraftFetched: 'defsDraftFetched',
}

export const areDefsFetched = R.pathEq([survey, keys.status, statusKeys.defsFetched], true)

export const areDefsDraftFetched = R.pathEq([survey, keys.status, statusKeys.defsDraftFetched], true)

export const assocDefsFetched = draft => R.pipe(
  R.assoc(statusKeys.defsFetched, true),
  R.assoc(statusKeys.defsDraftFetched, draft),
)