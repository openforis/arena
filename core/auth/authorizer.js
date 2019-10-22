const R = require('ramda')

const Survey = require('@core/survey/survey')
const Record = require('@core/record/record')
const User = require('@core/user/user')
const AuthGroups = require('./authGroups')

const {
  permissions,
  keys,
} = AuthGroups

const _isSurveyAdmin = (user, surveyInfo) =>
  Survey.isAuthGroupAdmin(getSurveyUserGroup(user, surveyInfo))(surveyInfo)

// ======
// ====== Survey
// ======

const getSurveyUserGroup = (user, surveyInfo, includeSystemAdmin = true) => {
  if (includeSystemAdmin && User.isSystemAdmin(user)) {
    return R.pipe(User.getAuthGroups, R.head)(user)
  }
  return AuthGroups.getAuthGroups(user).find(g => AuthGroups.getSurveyUuid(g) === Survey.getUuid(surveyInfo))
}

const getSurveyUserPermissions = (user, surveyInfo) =>
  R.propOr([], keys.permissions, getSurveyUserGroup(user, surveyInfo))

const hasSurveyPermission = permission => (user, surveyInfo) =>
  user && surveyInfo && (
    User.isSystemAdmin(user) ||
    R.includes(permission, getSurveyUserPermissions(user, surveyInfo))
  )

// READ
const canViewSurvey = (user, surveyInfo) => !!getSurveyUserGroup(user, surveyInfo)

// UPDATE
const canEditSurvey = hasSurveyPermission(permissions.surveyEdit)

// ======
// ====== Record
// ======

// CREATE
const canCreateRecord = hasSurveyPermission(permissions.recordCreate)

// READ
const canViewRecord = hasSurveyPermission(permissions.recordView)

// UPDATE
const canEditRecord = (user, record) => {
  if (!(user && record))
    return false

  if (User.isSystemAdmin(user))
    return true

  const recordDataStep = Record.getStep(record)

  const userAuthGroup = User.getAuthGroups(user).find(authGroup => AuthGroups.getSurveyUuid(authGroup) === Record.getSurveyUuid(record))

  // level = 'all' or 'own'. If 'own', user can only edit the records that he created
  // If 'all', he can edit all survey's records
  const level = R.path([keys.recordSteps, recordDataStep], userAuthGroup)

  return level === keys.all || (level === keys.own && Record.getOwnerUuid(record) === User.getUuid(user))
}

const canEditRecordsInDataQuery = R.pipe(
  getSurveyUserGroup,
  authGroup => R.includes(
    AuthGroups.getName(authGroup),
    [
      AuthGroups.groupNames.systemAdmin,
      AuthGroups.groupNames.surveyAdmin,
      AuthGroups.groupNames.surveyEditor,
      AuthGroups.groupNames.dataAnalyst,
      AuthGroups.groupNames.dataCleanser
    ]
  )
)

const canAnalyzeRecords = hasSurveyPermission(permissions.recordAnalyse)

// ======
// ====== Users
// ======

// CREATE
const canInviteUsers = hasSurveyPermission(permissions.userInvite)

// READ
const canViewUser = (user, surveyInfo, userToView) => {
  return User.isSystemAdmin(user) || (
    !!getSurveyUserGroup(user, surveyInfo, false) &&
    !!getSurveyUserGroup(userToView, surveyInfo, false)
  )
}

// EDIT
const _hasUserEditAccess = (user, surveyInfo, userToUpdate) =>
  User.isSystemAdmin(user) || (
    _isSurveyAdmin(user, surveyInfo) &&
    !!getSurveyUserGroup(userToUpdate, surveyInfo, false)
  )

const canEditUser = (user, surveyInfo, userToUpdate) => (
  User.hasAccepted(userToUpdate) && (
    User.isEqual(user)(userToUpdate) || _hasUserEditAccess(user, surveyInfo, userToUpdate)
  )
)

const canEditUserEmail = _hasUserEditAccess

const canEditUserGroup = (user, surveyInfo, userToUpdate) => (
  !User.isEqual(user)(userToUpdate) && _hasUserEditAccess(user, surveyInfo, userToUpdate)
)

const canRemoveUser = (user, surveyInfo, userToRemove) => (
  !User.isEqual(user)(userToRemove) &&
  !User.isSystemAdmin(userToRemove) &&
  _hasUserEditAccess(user, surveyInfo, userToRemove)
)

module.exports = {
  getSurveyUserGroup,

  // Survey permissions
  canViewSurvey,
  canEditSurvey,

  // Record permissions
  canCreateRecord,
  canViewRecord,
  canEditRecord,
  canEditRecordsInDataQuery,
  canAnalyzeRecords,

  // User permissions
  canInviteUsers,
  canViewUser,
  canEditUser,
  canEditUserEmail,
  canEditUserGroup,
  canRemoveUser,
}