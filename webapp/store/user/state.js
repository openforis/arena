import * as R from 'ramda'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

export const stateKey = 'user'

export const getState = R.propOr({}, stateKey)

// ====== READ
export const getUser = getState

// ====== SURVEY

export const assocUserPropsOnSurveyCreate = (survey) => (userState) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const user = R.pipe(
    User.assocPrefSurveyCurrentAndCycle(Survey.getIdSurveyInfo(surveyInfo), Survey.cycleOneKey),
    R.unless(User.isSystemAdmin, User.assocAuthGroup(Survey.getAuthGroupAdmin(surveyInfo)))
  )(userState)
  return user
}

export const assocUserPropsOnSurveyUpdate = (survey) => (userState) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const user = R.pipe(User.assocPrefSurveyCurrent(Survey.getIdSurveyInfo(surveyInfo)))(userState)
  return user
}

export const dissocUserPropsOnSurveyDelete = (surveyInfo) => (userState) => {
  const authGroup = R.pipe(
    User.getAuthGroups,
    R.find(R.propEq(AuthGroup.keys.surveyUuid, Survey.getUuid(surveyInfo)))
  )(userState)
  const user = R.pipe(
    User.dissocAuthGroup(authGroup),
    User.deletePrefSurvey(Survey.getIdSurveyInfo(surveyInfo))
  )(userState)
  return user
}
