import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as User from '@core/user/user'
import * as AuthGroup from '@core/auth/authGroup'

const { permissions, keys } = AuthGroup

// ======
// ====== Survey
// ======

const _getSurveyUserGroup = (user, surveyInfo) => {
  const surveyUuid = Survey.getUuid(surveyInfo)
  return User.getAuthGroupBySurveyUuid({ surveyUuid })(user)
}

const _hasAuthGroupForSurvey = ({ user, surveyInfo }) => Boolean(_getSurveyUserGroup(user, surveyInfo))

const _hasSurveyPermission = (permission) => (user, surveyInfo) => {
  if (!user) return false

  if (User.isSystemAdmin(user)) return true

  if (!surveyInfo) return false

  const authGroup = _getSurveyUserGroup(user, surveyInfo)
  if (!authGroup) return false

  return AuthGroup.getPermissions(authGroup).includes(permission)
}

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
  if (canCreateSurvey(user)) return User.getMaxSurveys(user)
  return 0
}

// READ
export const canViewSurvey = (user, surveyInfo) =>
  User.isSystemAdmin(user) || _hasAuthGroupForSurvey({ user, surveyInfo })
export const canExportSurvey = _hasSurveyPermission(permissions.surveyEdit)
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
export const canViewAllRecords = _hasSurveyPermission(permissions.recordCleanse)
export const canExportRecordsList = _hasSurveyPermission(permissions.surveyEdit)

// UPDATE
export const canEditRecord = (user, record) => {
  if (!(user && record)) {
    return false
  }

  if (User.isSystemAdmin(user)) {
    return true
  }

  const recordDataStep = Record.getStep(record)

  const userAuthGroup = User.getAuthGroupBySurveyUuid({ surveyUuid: Record.getSurveyUuid(record) })(user)
  if (!userAuthGroup) return false

  // Level = 'all' or 'own'. If 'own', user can only edit the records that he created
  // If 'all', he can edit all survey's records
  const level = AuthGroup.getRecordEditLevel(recordDataStep)(userAuthGroup)

  return level === keys.all || (level === keys.own && Record.getOwnerUuid(record) === User.getUuid(user))
}

export const canDeleteRecord = canEditRecord

export const canCleanseRecords = _hasSurveyPermission(permissions.recordCleanse)

export const canExportRecords = _hasSurveyPermission(permissions.recordView)

export const canImportRecords = (user, surveyInfo) =>
  Survey.isPublished(surveyInfo) && _hasSurveyPermission(permissions.recordCreate)(user, surveyInfo)

export const canAnalyzeRecords = _hasSurveyPermission(permissions.recordAnalyse)

export const canUpdateRecordsStep = canAnalyzeRecords

// ======
// ====== Explorer
// ======

export const canUseExplorer = canCleanseRecords

// ======
// ====== Map
// ======

export const canUseMap = canAnalyzeRecords

// ======
// ====== Charts
// ======

export const canUseCharts = (user, _surveyInfo) => User.isSystemAdmin(user)

// ======
// ====== Users
// ======

// CREATE
export const canInviteUsers = _hasSurveyPermission(permissions.userInvite)

// READ
export const canViewSurveyUsers = _hasSurveyPermission(permissions.userInvite)

export const canViewUser = (user, _surveyInfo, userToView) =>
  // system admin
  User.isSystemAdmin(user) ||
  // same user
  User.isEqual(userToView)(user) ||
  // both users have an auth group in the same survey
  User.getAuthGroups(user).some(
    (authGroupUser) =>
      AuthGroup.isSurveyGroup(authGroupUser) &&
      User.getAuthGroups(userToView).some(
        (authGroupUserToView) =>
          AuthGroup.isSurveyGroup(authGroupUserToView) &&
          AuthGroup.getSurveyUuid(authGroupUserToView) === AuthGroup.getSurveyUuid(authGroupUser)
      )
  )

export const canViewOtherUsersEmail = ({ user, surveyInfo }) =>
  User.isSystemAdmin(user) || canInviteUsers(user, surveyInfo)

export const canViewAllUsers = (user) => User.isSystemAdmin(user)

// EDIT
const _hasUserEditAccess = (user, surveyInfo, userToUpdate) =>
  User.isSystemAdmin(user) ||
  (_hasSurveyPermission(permissions.userEdit)(user, surveyInfo) &&
    // user to update has an auth group in the same survey
    _hasAuthGroupForSurvey({ user: userToUpdate, surveyInfo }))

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

export const canEditUserMaxSurveys = (user) => User.isSystemAdmin(user)

// USER ACCESS REQUESTS
export const canViewUsersAccessRequests = (user) => User.isSystemAdmin(user)
export const canEditUsersAccessRequests = (user) => User.isSystemAdmin(user)

// INVITE
export const getUserGroupsCanAssign = ({
  user,
  surveyInfo = null,
  editingLoggedUser = false,
  showOnlySurveyGroups = false,
}) => {
  const groups = []

  let surveyGroups
  if (editingLoggedUser && !surveyInfo) {
    // This can happen for system administrators when they don't have an active survey
    surveyGroups = []
  } else if (Survey.isPublished(surveyInfo)) {
    surveyGroups = Survey.getAuthGroups(surveyInfo)
  } else {
    surveyGroups = [Survey.getAuthGroupAdmin(surveyInfo)]
  }

  // do not allow surveyEditor group selection (remove surveyEditor group completely?)
  surveyGroups = surveyGroups.filter((group) => AuthGroup.getName(group) !== AuthGroup.groupNames.surveyEditor)

  groups.push(...surveyGroups)

  if (!showOnlySurveyGroups && (User.isSystemAdmin(user) || User.isSurveyManager(user))) {
    // Add SystemAdmin or SurveyManager group if current user is a SystemAdmin or SurveyManager himself
    const userNonSurveyGroups = User.getAuthGroups(user).filter((group) => !AuthGroup.isSurveyGroup(group))
    groups.push(...userNonSurveyGroups)
  }
  return AuthGroup.sortGroups(groups)
}
