import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as User from '@core/user/user'
import * as AuthGroup from '@core/auth/authGroup'

const { permissions, keys } = AuthGroup

// ======
// ====== Survey
// ======

const _getSurveyUserGroup = (user, surveyInfo, includeSystemAdmin = true) =>
  User.getAuthGroupBySurveyUuid(Survey.getUuid(surveyInfo), includeSystemAdmin)(user)

const _hasSurveyPermission = (permission) => (user, surveyInfo) =>
  user &&
  surveyInfo &&
  (User.isSystemAdmin(user) ||
    R.includes(permission, R.pipe(_getSurveyUserGroup, AuthGroup.getPermissions)(user, surveyInfo)))

// READ
export const canViewSurvey = (user, surveyInfo) => Boolean(_getSurveyUserGroup(user, surveyInfo))

// UPDATE
export const canEditSurvey = _hasSurveyPermission(permissions.surveyEdit)

// ======
// ====== Record
// ======

// CREATE
export const canCreateRecord = _hasSurveyPermission(permissions.recordCreate)

// READ
export const canViewRecord = _hasSurveyPermission(permissions.recordView)

// UPDATE
export const canEditRecord = (user, record) => {
  if (!(user && record)) {
    return false
  }

  if (User.isSystemAdmin(user)) {
    return true
  }

  const recordDataStep = Record.getStep(record)

  const userAuthGroup = User.getAuthGroupBySurveyUuid(Record.getSurveyUuid(record))(user)

  // Level = 'all' or 'own'. If 'own', user can only edit the records that he created
  // If 'all', he can edit all survey's records
  const level = AuthGroup.getRecordEditLevel(recordDataStep)(userAuthGroup)

  return level === keys.all || (level === keys.own && Record.getOwnerUuid(record) === User.getUuid(user))
}

export const canCleanseRecords = _hasSurveyPermission(permissions.recordCleanse)

export const canAnalyzeRecords = _hasSurveyPermission(permissions.recordAnalyse)

// ======
// ====== Users
// ======

// CREATE
export const canInviteUsers = _hasSurveyPermission(permissions.userInvite)

// READ
export const canViewUser = (user, surveyInfo, userToView) => {
  return (
    User.isSystemAdmin(user) ||
    (Boolean(_getSurveyUserGroup(user, surveyInfo, false)) &&
      Boolean(_getSurveyUserGroup(userToView, surveyInfo, false)))
  )
}

export const canViewOtherUsersEmail = ({ user, surveyInfo }) =>
  User.isSystemAdmin(user) || canInviteUsers(user, surveyInfo)

// EDIT
const _hasUserEditAccess = (user, surveyInfo, userToUpdate) =>
  User.isSystemAdmin(user) ||
  (_hasSurveyPermission(permissions.userEdit)(user, surveyInfo) &&
    Boolean(_getSurveyUserGroup(userToUpdate, surveyInfo, false)))

export const canEditUser = (user, surveyInfo, userToUpdate) =>
  User.hasAccepted(userToUpdate) &&
  (User.isEqual(user)(userToUpdate) || _hasUserEditAccess(user, surveyInfo, userToUpdate))

export const canEditUserEmail = _hasUserEditAccess

export const canEditUserGroup = (user, surveyInfo, userToUpdate) =>
  !User.isEqual(user)(userToUpdate) && _hasUserEditAccess(user, surveyInfo, userToUpdate)

export const canRemoveUser = (user, surveyInfo, userToRemove) =>
  !User.isEqual(user)(userToRemove) &&
  !User.isSystemAdmin(userToRemove) &&
  _hasUserEditAccess(user, surveyInfo, userToRemove)
