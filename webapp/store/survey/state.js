import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as User from '@core/user/user'

import * as UserState from '@webapp/store/user/state'

const survey = 'survey'
export const stateKey = survey

// ====== READ
export const getSurvey = A.prop(survey)

export const getSurveyInfo = A.pipe(getSurvey, Survey.getSurveyInfo)

export const getSurveyDefaultLang = A.pipe(getSurveyInfo, Survey.getDefaultLanguage)

export const getSurveyId = A.pipe(getSurvey, Survey.getId)

export const getSurveyName = A.pipe(getSurveyInfo, Survey.getName)

export const getSurveyUuid = A.pipe(getSurveyInfo, Survey.getUuid)

export const getSurveyCycleKey = (state) => {
  const surveyId = getSurveyId(state)
  const user = UserState.getUser(state)
  return User.getPrefSurveyCycle(surveyId)(user)
}

export const getSurveyCyclesKeys = A.pipe(getSurvey, Survey.getSurveyInfo, Survey.getCycleKeys)

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
