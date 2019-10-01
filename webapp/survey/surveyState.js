import * as R from 'ramda'

import Survey from '../../common/survey/survey'
import NodeDef from '../../common/survey/nodeDef'
import User from '../../common/user/user'

import * as AppState from '../app/appState'

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

export const getSurveyCycleKey = state => R.pipe(
  AppState.getUser,
  User.getPrefSurveyCycle(getSurveyId(state)),
)(state)

export const getNodeDefLabel = nodeDef => state => {
  const surveyInfo = getSurveyInfo(state)
  const langApp = AppState.getLang(state)
  const langSurvey = Survey.getLanguage(langApp)(surveyInfo)
  const label = NodeDef.getLabel(nodeDef, langSurvey)
  return label
}

// STATUS
const keys = {
  status: 'status'
}

const statusKeys = {
  defsFetched: 'defsFetched',
  defsDraftFetched: 'defsDraftFetched',
}

const _areDefsFetched = R.pathEq([survey, keys.status, statusKeys.defsFetched], true)

const _areDefsDraftFetched = R.pathEq([survey, keys.status, statusKeys.defsDraftFetched], true)

export const areDefsFetched = draft => state => _areDefsFetched(state) && _areDefsDraftFetched(state) === draft

export const assocDefsFetched = draft => R.pipe(
  R.assoc(statusKeys.defsFetched, true),
  R.assoc(statusKeys.defsDraftFetched, draft),
)

export const resetDefsFetched = R.pipe(
  R.assoc(statusKeys.defsFetched, false),
  R.assoc(statusKeys.defsDraftFetched, false),
)