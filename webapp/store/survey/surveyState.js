import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as User from '@core/user/user'

import * as AppState from '@webapp/app/appState'

const survey = 'survey'
export const stateKey = survey

// ====== READ
export const getSurvey = R.prop(survey)

export const getSurveyInfo = R.pipe(getSurvey, Survey.getSurveyInfo)

export const getSurveyDefaultLang = R.pipe(getSurveyInfo, Survey.getDefaultLanguage)

export const getSurveyId = R.pipe(getSurvey, Survey.getId)

export const getSurveyCycleKey = (state) => R.pipe(AppState.getUser, User.getPrefSurveyCycle(getSurveyId(state)))(state)

export const getNodeDefLabel = (nodeDef) => (state) => {
  const surveyInfo = getSurveyInfo(state)
  const langApp = AppState.getLang(state)
  const langSurvey = Survey.getLanguage(langApp)(surveyInfo)
  return NodeDef.getLabel(nodeDef, langSurvey)
}
