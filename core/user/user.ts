import * as A from '@core/arena'

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
export const getName = A.propOr('', keys.name)
export const getEmail = A.prop(keys.email)
export const getInvitedBy = A.prop(keys.invitedBy)
export const getInvitedDate = A.prop(keys.invitedDate)
export const getPassword = A.prop(keys.password)
export const getLang = A.propOr('en', keys.lang)
export const getPrefs = A.propOr({}, keys.prefs)
export const getProps = A.propOr({}, keys.props)
export const getProfilePicture = A.prop(keys.profilePicture)
export const hasProfilePicture = A.propEq(keys.hasProfilePicture, true)
export const isProfilePictureSet = A.propEq(keys.profilePictureSet, true)
export const getStatus = A.prop(keys.status)
export const { getValidation } = Validation
export const getAuthGroupsUuids = A.propOr([], keys.authGroupsUuids)
export const getAuthGroupExtraProps = A.propOr({}, keys.authGroupExtraProps)
export const getAuthGroupExtraProp = (prop: string) => A.pipe(getAuthGroupExtraProps, A.prop(prop))
export const getLastLoginTime = A.prop(keys.lastLoginTime)
export const getSurveysCountDraft = A.prop(keys.surveysCountDraft)
export const getSurveysCountPublished = A.prop(keys.surveysCountPublished)
export const getResetPasswordUuid = A.prop(keys.resetPasswordUuid)
export const getAccessRequestDate = A.prop(keys.accessRequestDate)

// ====== UPDATE
export const assocProp = A.assoc
export const assocEmail = A.assoc(keys.email)
export const { assocValidation } = Validation
export const assocName = A.assoc(keys.name)
export const assocInvitationExpired = A.assoc(keys.invitationExpired)
export const assocProfilePicture = A.assoc(keys.profilePicture)
export const assocProfilePictureSet = A.assoc(keys.profilePictureSet)

// ====== CHECK
export const isSystemAdmin = (user: any | null | undefined) =>
  !!user && A.any(AuthGroup.isSystemAdminGroup)(getAuthGroups(user))
export const isSurveyManager = (user: any | null | undefined) =>
  !!user && A.any(AuthGroup.isSurveyManagerGroup)(getAuthGroups(user))
export const hasAccepted = A.propEq(keys.status, userStatus.ACCEPTED)
export const isInvited = A.propEq(keys.status, userStatus.INVITED)
export const isInvitationExpired = A.propEq(keys.invitationExpired, true)

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
  A.pipe(
    A.assoc(keys.authGroups, authGroups),
    A.assoc(
      keys.authGroupsUuids,
      authGroups.map((authGroup) => ObjectUtils.getUuid(authGroup))
    )
  )

const _updateAuthGroups = (updateFn: (a: unknown[]) => unknown[]) => (user: any) =>
  A.pipe(getAuthGroups, updateFn, (authGroups) => assocAuthGroups(authGroups as any[])(user))(user)

export const assocAuthGroup = (authGroup: any) => _updateAuthGroups(A.append(authGroup))
export const dissocAuthGroup = (authGroup: any) => _updateAuthGroups(A.reject(AuthGroup.isEqual(authGroup as never)))
export const assocAuthGroupExtraProps = A.assoc(keys.authGroupExtraProps)

// PREFS
export const {
  newPrefs,
  getPrefSurveyCurrent,
  getPrefSurveyCycle,
  getPrefSurveyLang,
  getPrefSurveyCurrentCycle,
  getPrefLanguage,
  getPrefNotifyOnUserAccessRequest,
  assocPrefSurveyCurrent,
  assocPrefSurveyCycle,
  assocPrefSurveyLang,
  assocPrefSurveyCurrentAndCycle,
  deletePrefSurvey,
  assocPrefLanguage,
  assocPrefNotifyOnUserAccessRequest,
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
