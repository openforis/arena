import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'
import * as AuthGroup from '@core/auth/authGroup'

import { keys } from './_user/userKeys'
import * as UserPrefs from './_user/userPrefs'
import { userStatus } from './_user/userStatus'

export { keys } from './_user/userKeys'
export { userStatus } from './_user/userStatus'

export const keysPrefs = UserPrefs.keysPrefs

// ====== READ
export const isEqual = ObjectUtils.isEqual
export const getUuid = ObjectUtils.getUuid
export const getName = R.propOr('', keys.name)
export const getEmail = R.prop(keys.email)
export const getLang = R.propOr('en', keys.lang)
export const getAuthGroups = ObjectUtils.getAuthGroups
export const getPrefs = R.propOr({}, keys.prefs)
export const hasProfilePicture = R.propEq(keys.hasProfilePicture, true)

// ====== CHECK
export const isSystemAdmin = user => user && R.any(AuthGroup.isSystemAdminGroup)(getAuthGroups(user))
export const hasAccepted = R.pipe(getName, StringUtils.isNotBlank)

// ====== AUTH GROUP
export const getAuthGroupBySurveyUuid = (surveyUuid, includeSystemAdmin = true) => user =>
  R.pipe(
    getAuthGroups,
    R.ifElse(
      R.always(includeSystemAdmin && isSystemAdmin(user)),
      R.head,
      R.find(group => AuthGroup.getSurveyUuid(group) === surveyUuid),
    ),
  )(user)

export const assocAuthGroup = authGroup => user => {
  const authGroups = R.pipe(getAuthGroups, R.append(authGroup))(user)
  return R.assoc(keys.authGroups, authGroups, user)
}

export const dissocAuthGroup = authGroup => user => {
  const authGroups = R.pipe(getAuthGroups, R.reject(R.propEq(AuthGroup.keys.uuid, AuthGroup.getUuid(authGroup))))(user)
  return R.assoc(keys.authGroups, authGroups, user)
}

// PREFS
export const newPrefs = UserPrefs.newPrefs
export const getPrefSurveyCurrent = UserPrefs.getPrefSurveyCurrent
export const getPrefSurveyCycle = UserPrefs.getPrefSurveyCycle
export const getPrefSurveyCurrentCycle = UserPrefs.getPrefSurveyCurrentCycle

export const assocPrefSurveyCurrent = UserPrefs.assocPrefSurveyCurrent
export const assocPrefSurveyCycle = UserPrefs.assocPrefSurveyCycle
export const assocPrefSurveyCurrentAndCycle = UserPrefs.assocPrefSurveyCurrentAndCycle

export const deletePrefSurvey = UserPrefs.deletePrefSurvey
