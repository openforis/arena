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

export const getStateSurveyInfo = R.pipe(getSurvey, Survey.getSurveyInfo)

export const getStateSurveyId = R.pipe(getStateSurveyInfo, R.prop('id'))

// STATUS
const status = 'status'
const defsFetched = 'defsFetched'
const defsDraftFetched = 'defsDraftFetched'

export const surveyDefsFetched = R.pathEq([survey, status, defsFetched], true)

export const surveyDefsDraftFetched = R.pathEq([survey, status, defsDraftFetched], true)

export const setSurveyDefsFetched = draft => R.pipe(
  R.assoc(defsFetched, true),
  R.assoc(defsDraftFetched, draft),
)