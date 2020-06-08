import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as AuthGroup from '@core/auth/authGroup'

export const keys = {
  status: 'status',
  user: 'user',
  saving: 'saving',

  // I18n
  i18n: 'i18n',
  lang: 'lang',
}

export const stateKey = 'app'

export const getState = R.prop(stateKey)

export const appStatus = {
  ready: 'ready',
}

export const isReady = R.pipe(getState, R.propEq(keys.status, appStatus.ready))

// ==== APP USER

export const getUser = R.pipe(getState, R.prop(keys.user))

export const logoutUser = R.dissoc(keys.user)

export const assocUserPropsOnSurveyCreate = (survey) => (appState) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const user = R.pipe(
    R.prop(keys.user),
    User.assocPrefSurveyCurrentAndCycle(Survey.getIdSurveyInfo(surveyInfo), Survey.cycleOneKey),
    R.unless(User.isSystemAdmin, User.assocAuthGroup(Survey.getAuthGroupAdmin(surveyInfo)))
  )(appState)
  return R.assoc(keys.user, user, appState)
}

export const assocUserPropsOnSurveyUpdate = (survey) => (appState) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const user = R.pipe(R.prop(keys.user), User.assocPrefSurveyCurrent(Survey.getIdSurveyInfo(surveyInfo)))(appState)
  return R.assoc(keys.user, user, appState)
}

export const dissocUserPropsOnSurveyDelete = (surveyInfo) => (appState) => {
  const authGroup = R.pipe(
    R.prop(keys.user),
    User.getAuthGroups,
    R.find(R.propEq(AuthGroup.keys.surveyUuid, Survey.getUuid(surveyInfo)))
  )(appState)
  const user = R.pipe(
    R.prop(keys.user),
    User.dissocAuthGroup(authGroup),
    User.deletePrefSurvey(Survey.getIdSurveyInfo(surveyInfo))
  )(appState)
  return R.assoc(keys.user, user, appState)
}

// ==== SAVING
export const assocSaving = R.assoc(keys.saving)

export const isSaving = R.pipe(getState, R.propEq(keys.saving, true))

// ==== APP I18N
export const getI18n = R.pipe(getState, R.prop(keys.i18n))

export const getLang = R.pipe(getI18n, R.prop(keys.lang))
