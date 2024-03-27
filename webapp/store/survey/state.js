import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as UserState from '@webapp/store/user/state'

const survey = 'survey'
export const stateKey = survey

// ====== READ
export const getSurvey = R.prop(survey)

export const getSurveyInfo = R.pipe(getSurvey, Survey.getSurveyInfo)

export const getSurveyDefaultLang = R.pipe(getSurveyInfo, Survey.getDefaultLanguage)

export const getSurveyId = R.pipe(getSurvey, Survey.getId)

export const getSurveyCycleKey = (state) => {
  const surveyId = getSurveyId(state)
  const user = UserState.getUser(state)
  return User.getPrefSurveyCycle(surveyId)(user)
}

export const getSurveyCyclesKeys = R.pipe(getSurvey, Survey.getSurveyInfo, Survey.getCycleKeys)

export const getSurveyPreferredLang = (state) => {
  const surveyInfo = getSurveyInfo(state)
  const user = UserState.getUser(state)
  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
  const preferredLanguage = User.getPrefSurveyLang(surveyId)(user)

  // check that preferred language is among survey languages
  return preferredLanguage && Survey.getLanguages(surveyInfo).includes(preferredLanguage)
    ? preferredLanguage
    : Survey.getDefaultLanguage(surveyInfo)
}

export const getNodeDefLabel = (nodeDef) => (state) => {
  const prefLang = getSurveyPreferredLang(state)
  return NodeDef.getLabel(nodeDef, prefLang)
}
