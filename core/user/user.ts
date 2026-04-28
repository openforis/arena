import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as AuthGroup from '@core/auth/authGroup'
import * as Validation from '@core/validation/validation'

import { keys } from './_user/userKeys'
import * as UserPrefs from './_user/userPrefs'
import * as UserProps from './_user/userProps'
import { userStatus } from './_user/userStatus'

export { keys } from './_user/userKeys'
export { keysProps } from './_user/userProps'
export { userStatus } from './_user/userStatus'

export const nameMaxLength = 128

export const { keysPrefs, keysSurveyPrefs } = UserPrefs

// ====== READ
export const { getAuthGroups, getExtra, getExtraProp, getUuid, isEqual } = ObjectUtils
export const getName = R.propOr('', keys.name)
export const getEmail = R.prop(keys.email)
export const getInvitedBy = R.prop(keys.invitedBy)
export const getInvitedDate = R.prop(keys.invitedDate)
export const getPassword = R.prop(keys.password)
export const getLang = R.propOr('en', keys.lang)
export const getPrefs = R.propOr({}, keys.prefs)
export const getProps = R.propOr({}, keys.props)
export const getProfilePicture = R.prop(keys.profilePicture)
export const hasProfilePicture = R.propEq(keys.hasProfilePicture, true)
export const isProfilePictureSet = R.propEq(keys.profilePictureSet, true)
export const getStatus = R.prop(keys.status)
export const { getValidation } = Validation
export const getAuthGroupsUuids = R.propOr([], keys.authGroupsUuids)
export const getAuthGroupExtraProps = R.propOr({}, keys.authGroupExtraProps)
export const getAuthGroupExtraProp = (prop: string) => R.pipe(getAuthGroupExtraProps, R.prop(prop))
export const getLastLoginTime = R.prop(keys.lastLoginTime)
export const getSurveysCountDraft = R.prop(keys.surveysCountDraft)
export const getSurveysCountPublished = R.prop(keys.surveysCountPublished)
export const getResetPasswordUuid = R.prop(keys.resetPasswordUuid)
export const getAccessRequestDate = R.prop(keys.accessRequestDate)

// ====== UPDATE
export const assocProp = R.assoc
export const assocEmail = R.assoc(keys.email)
export const { assocValidation } = Validation
export const assocName = R.assoc(keys.name)
export const assocInvitationExpired = R.assoc(keys.invitationExpired)
export const assocProfilePicture = R.assoc(keys.profilePicture)
export const assocProfilePictureSet = R.assoc(keys.profilePictureSet)

// ====== CHECK
export const isSystemAdmin = (user: any | null | undefined) =>
  !!user && R.any(AuthGroup.isSystemAdminGroup)(getAuthGroups(user))
export const isSurveyManager = (user: any | null | undefined) =>
  !!user && R.any(AuthGroup.isSurveyManagerGroup)(getAuthGroups(user))
export const hasAccepted = R.propEq(keys.status, userStatus.ACCEPTED)
export const isInvited = R.propEq(keys.status, userStatus.INVITED)
export const isInvitationExpired = R.propEq(keys.invitationExpired, true)

// ====== AUTH GROUP
export const getAuthGroupBySurveyUuid =
  ({ surveyUuid, defaultToMainGroup = false }: { surveyUuid: string; defaultToMainGroup?: boolean }) =>
  (user: any) => {
    const authGroups = getAuthGroups(user)
    const authGroup = authGroups.find((group: unknown) => AuthGroup.getSurveyUuid(group as never) === surveyUuid)
    if (authGroup) {
      return authGroup
    }
    if (defaultToMainGroup) {
      return getSystemAdminGroup(user) || getSurveyManagerGroup(user)
    }
    return null
  }

export const getAuthGroupByName = (groupName: string) => (user: any) => {
  const authGroups = getAuthGroups(user)
  return authGroups.find((group: unknown) => AuthGroup.getName(group as never) === groupName)
}

export const getAuthGroupsNonSurvey = () => (user: any) => {
  const authGroups = getAuthGroups(user)
  return authGroups.filter((group: unknown) => !AuthGroup.getSurveyId(group as never))
}

export const getSystemAdminGroup = (user: any | null | undefined) =>
  user && getAuthGroups(user).find(AuthGroup.isSystemAdminGroup)
export const getSurveyManagerGroup = (user: any | null | undefined) =>
  user && getAuthGroups(user).find(AuthGroup.isSurveyManagerGroup)

export const assocAuthGroups = (authGroups: any[]) =>
  R.pipe(
    R.assoc(keys.authGroups, authGroups),
    R.assoc(
      keys.authGroupsUuids,
      authGroups.map((authGroup) => ObjectUtils.getUuid(authGroup))
    )
  )

const _updateAuthGroups = (updateFn: (a: unknown[]) => unknown[]) => (user: any) =>
  R.pipe(getAuthGroups, updateFn, (authGroups) => assocAuthGroups(authGroups as any[])(user))(user)

export const assocAuthGroup = (authGroup: any) => _updateAuthGroups(R.append(authGroup))
export const dissocAuthGroup = (authGroup: any) => _updateAuthGroups(R.reject(AuthGroup.isEqual(authGroup as never)))
export const assocAuthGroupExtraProps = R.assoc(keys.authGroupExtraProps)

// PREFS
export const {
  newPrefs,
  getPrefSurveyCurrent,
  getPrefSurveyCycle,
  getPrefSurveyLang,
  getPrefSurveyCurrentCycle,
  getPrefLanguage,
  assocPrefSurveyCurrent,
  assocPrefSurveyCycle,
  assocPrefSurveyLang,
  assocPrefSurveyCurrentAndCycle,
  deletePrefSurvey,
  assocPrefLanguage,
} = UserPrefs

// PROPS
export const {
  getTitle,
  getMapApiKey,
  getMaxSurveys,
  assocTitle,
  assocMapApiKey,
  assocMaxSurveys,
  assocExtra,
  titleKeys,
  titleKeysArray,
  newProps,
  dissocPrivateProps,
  dissocRestrictedProps,
} = UserProps
