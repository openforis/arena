import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as AuthGroup from '@core/auth/authGroup'
import * as Validation from '@core/validation/validation'

import { keys } from './_user/userKeys'
import * as UserPrefs from './_user/userPrefs'
import * as UserProps from './_user/userProps'
import { userStatus } from './_user/userStatus'

export { keys } from './_user/userKeys'
export { userStatus } from './_user/userStatus'

export const nameMaxLength = 128

export const { keysPrefs, keysSurveyPrefs } = UserPrefs
export const { keysProps } = UserProps

// ====== READ
export const { isEqual } = ObjectUtils
export const { getUuid } = ObjectUtils
export const getName = R.propOr('', keys.name)
export const getEmail = R.prop(keys.email)
export const getInvitedBy = R.prop(keys.invitedBy)
export const getInvitedDate = R.prop(keys.invitedDate)
export const getPassword = R.prop(keys.password)
export const getGroupUuid = R.prop(keys.groupUuid)
export const getLang = R.propOr('en', keys.lang)
export const { getAuthGroups } = ObjectUtils
export const getPrefs = R.propOr({}, keys.prefs)
export const getProps = R.propOr({}, keys.props)
export const getProfilePicture = R.prop(keys.profilePicture)
export const hasProfilePicture = R.propEq(keys.hasProfilePicture, true)
export const getStatus = R.prop(keys.status)
export const { getValidation } = Validation

// ====== UPDATE
export const assocProp = R.assoc
export const assocEmail = R.assoc(keys.email)
export const { assocValidation } = Validation
export const assocGroupUuid = R.assoc(keys.groupUuid)
export const assocName = R.assoc(keys.name)
export const assocInvitationExpired = R.assoc(keys.invitationExpired)
export const assocProfilePicture = R.assoc(keys.profilePicture)

// ====== CHECK
export const isSystemAdmin = (user) => user && R.any(AuthGroup.isSystemAdminGroup)(getAuthGroups(user))
export const hasAccepted = R.propEq(keys.status, userStatus.ACCEPTED)
export const isInvited = R.propEq(keys.status, userStatus.INVITED)
export const isInvitationExpired = R.propEq(keys.invitationExpired, true)

// ====== AUTH GROUP
export const getAuthGroupBySurveyUuid =
  (surveyUuid, includeSystemAdmin = true) =>
  (user) =>
    R.pipe(
      getAuthGroups,
      R.ifElse(
        R.always(includeSystemAdmin && isSystemAdmin(user)),
        R.head,
        R.find((group) => AuthGroup.getSurveyUuid(group) === surveyUuid)
      )
    )(user)

export const assocAuthGroups = R.assoc(keys.authGroups)

const _updateAuthGroups = (updateFn) => (user) =>
  R.pipe(getAuthGroups, updateFn, (authGroups) => assocAuthGroups(authGroups)(user))(user)

export const assocAuthGroup = (authGroup) => _updateAuthGroups(R.append(authGroup))

export const dissocAuthGroup = (authGroup) => _updateAuthGroups(R.reject(AuthGroup.isEqual(authGroup)))

// PREFS
export const {
  newPrefs,
  getPrefSurveyCurrent,
  getPrefSurveyCycle,
  getPrefSurveyLang,
  getPrefSurveyCurrentCycle,
  assocPrefSurveyCurrent,
  assocPrefSurveyCycle,
  assocPrefSurveyLang,
  assocPrefSurveyCurrentAndCycle,
  deletePrefSurvey,
} = UserPrefs

// PROPS
export const { getTitle, assocTitle, titleKeys, newProps } = UserProps
