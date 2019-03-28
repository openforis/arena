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
const keys = {
  status: 'status',

  hasCollectImportReport: 'hasCollectImportReport'
}

const statusKeys = {
  defsFetched: 'defsFetched',
  defsDraftFetched: 'defsDraftFetched',
}

export const surveyDefsFetched = R.pathEq([survey, keys.status, statusKeys.defsFetched], true)

export const surveyDefsDraftFetched = R.pathEq([survey, keys.status, statusKeys.defsDraftFetched], true)

export const hasCollectImportReport = R.propEq(hasCollectImportReport, true)

export const setSurveyDefsFetched = draft => R.pipe(
  R.assoc(statusKeys.defsFetched, true),
  R.assoc(statusKeys.defsDraftFetched, draft),
)

export const setHasCollectImportReport = value => R.assoc(keys.hasCollectImportReport, value)