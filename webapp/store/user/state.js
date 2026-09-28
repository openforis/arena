import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as AuthGroup from '@core/auth/authGroup'

export const stateKey = 'user'

export const getState = A.propOr({}, stateKey)

// ====== READ
export const getUser = getState

// ====== SURVEY

export const assocUserPropsOnSurveyCreate = (survey) => (userState) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const user = A.pipe(
    User.assocPrefSurveyCurrentAndCycle(Survey.getIdSurveyInfo(surveyInfo), Survey.cycleOneKey),
    A.unless(User.isSystemAdmin, User.assocAuthGroup(Survey.getAuthGroupAdmin(surveyInfo)))
  )(userState)
  return user
}

export const assocUserPropsOnSurveyUpdate = (survey) => (userState) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const user = A.pipe(User.assocPrefSurveyCurrent(Survey.getIdSurveyInfo(surveyInfo)))(userState)
  return user
}

export const dissocUserPropsOnSurveyDelete = (surveyInfo) => (userState) => {
  const authGroup = A.pipe(
    User.getAuthGroups,
    A.find(A.propEq(AuthGroup.keys.surveyUuid, Survey.getUuid(surveyInfo)))
  )(userState)
  const user = A.pipe(
    User.dissocAuthGroup(authGroup),
    User.deletePrefSurvey(Survey.getIdSurveyInfo(surveyInfo))
  )(userState)
  return user
}
