import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as User from '@core/user/user'
import * as AuthGroup from '@core/auth/authGroup'

const { permissions, keys } = AuthGroup

const MAX_SURVEYS_CREATED_BY_USER = 5

// ======
// ====== Survey
// ======

const _getSurveyUserGroup = (user, surveyInfo, includeSystemAdmin = true) =>
  User.getAuthGroupBySurveyUuid(Survey.getUuid(surveyInfo), includeSystemAdmin)(user)

const _hasSurveyPermission = (permission) => (user, surveyInfo) =>
  user &&
  (User.isSystemAdmin(user) ||
    (surveyInfo && R.includes(permission, R.pipe(_getSurveyUserGroup, AuthGroup.getPermissions)(user, surveyInfo))))

const _hasPermissionInSomeGroup = (permission) => (user) => {
  if (User.isSystemAdmin(user)) return true
  const groups = User.getAuthGroups(user)
  return groups.some((group) => AuthGroup.getPermissions(group).includes(permission))
}

// CREATE
export const canCreateSurvey = _hasPermissionInSomeGroup(permissions.surveyCreate)
export const canCreateTemplate = (user) => User.isSystemAdmin(user)
export const getMaxSurveysUserCanCreate = (user) => {
  if (User.isSystemAdmin(user)) return NaN
  if (canCreateSurvey(user)) return MAX_SURVEYS_CREATED_BY_USER
  return 0
}

// READ
export const canViewSurvey = (user, surveyInfo) => Boolean(_getSurveyUserGroup(user, surveyInfo))
export const canViewTemplates = (user) => User.isSystemAdmin(user)

// UPDATE
export const canEditSurvey = _hasSurveyPermission(permissions.surveyEdit)
export const canEditTemplates = (user) => User.isSystemAdmin(user)
export const canRefreshAllSurveyRdbs = (user) => User.isSystemAdmin(user)

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

export const canUpdateRecordsStep = canAnalyzeRecords

// ======
// ====== Users
// ======

// CREATE
export const canInviteUsers = _hasSurveyPermission(permissions.userInvite)

// READ
export const canViewUser = (user, surveyInfo, userToView) => {
  return (
    // system admin
    User.isSystemAdmin(user) ||
    // same user
    User.isEqual(userToView)(user) ||
    //
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

// USER ACCESS REQUESTS
export const canViewUsersAccessRequests = (user) => User.isSystemAdmin(user)
export const canEditUsersAccessRequests = (user) => User.isSystemAdmin(user)

// INVITE
export const getUserGroupsCanAssign = ({ user, surveyInfo = null, editingLoggedUser = false }) => {
  let surveyGroups
  if (editingLoggedUser && !surveyInfo) {
    // This can happen for system administrators when they don't have an active survey
    surveyGroups = []
  } else if (Survey.isPublished(surveyInfo)) {
    surveyGroups = Survey.getAuthGroups(surveyInfo)
  } else {
    surveyGroups = [Survey.getAuthGroupAdmin(surveyInfo)]
  }

  const groups = []
  if (User.isSystemAdmin(user) || User.isSurveyManager(user)) {
    // Add SystemAdmin or SurveyManager group if current user is a SystemAdmin or SurveyManager himself
    groups.push(...User.getAuthGroups(user))
  }
  groups.push(...surveyGroups)
  return AuthGroup.sortGroups(groups)
}
