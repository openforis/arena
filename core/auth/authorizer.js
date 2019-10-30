const R = require('ramda')

const Survey = require('@core/survey/survey')
const Record = require('@core/record/record')
const User = require('@core/user/user')
const AuthGroup = require('@core/auth/authGroup')

const {
  permissions,
  keys,
} = AuthGroup

// ======
// ====== Survey
// ======

const _getSurveyUserGroup = (user, surveyInfo, includeSystemAdmin = true) =>
  User.getAuthGroupBySurveyUuid(Survey.getUuid(surveyInfo), includeSystemAdmin)(user)

const _hasSurveyPermission = permission => (user, surveyInfo) =>
  user && surveyInfo && (
    User.isSystemAdmin(user) ||
    R.includes(permission, R.pipe(_getSurveyUserGroup, AuthGroup.getPermissions)(user, surveyInfo))
  )

// READ
const canViewSurvey = (user, surveyInfo) => !!_getSurveyUserGroup(user, surveyInfo)

// UPDATE
const canEditSurvey = _hasSurveyPermission(permissions.surveyEdit)

// ======
// ====== Record
// ======

// CREATE
const canCreateRecord = _hasSurveyPermission(permissions.recordCreate)

// READ
const canViewRecord = _hasSurveyPermission(permissions.recordView)

// UPDATE
const canEditRecord = (user, record) => {
  if (!(user && record))
    return false

  if (User.isSystemAdmin(user))
    return true

  const recordDataStep = Record.getStep(record)

  const userAuthGroup = User.getAuthGroupBySurveyUuid(Record.getSurveyUuid(record))(user)

  // level = 'all' or 'own'. If 'own', user can only edit the records that he created
  // If 'all', he can edit all survey's records
  const level = AuthGroup.getRecordEditLevel(recordDataStep)(userAuthGroup)

  return level === keys.all || (level === keys.own && Record.getOwnerUuid(record) === User.getUuid(user))
}

const canEditRecordsInDataQuery = R.pipe(
  _getSurveyUserGroup,
  authGroup => R.includes(
    AuthGroup.getName(authGroup),
    [
      AuthGroup.groupNames.systemAdmin,
      AuthGroup.groupNames.surveyAdmin,
      AuthGroup.groupNames.surveyEditor,
      AuthGroup.groupNames.dataAnalyst,
      AuthGroup.groupNames.dataCleanser
    ]
  )
)

const canAnalyzeRecords = _hasSurveyPermission(permissions.recordAnalyse)

// ======
// ====== Users
// ======

// CREATE
const canInviteUsers = _hasSurveyPermission(permissions.userInvite)

// READ
const canViewUser = (user, surveyInfo, userToView) => {
  return User.isSystemAdmin(user) || (
    !!_getSurveyUserGroup(user, surveyInfo, false) &&
    !!_getSurveyUserGroup(userToView, surveyInfo, false)
  )
}

// EDIT
const _hasUserEditAccess = (user, surveyInfo, userToUpdate) =>
  User.isSystemAdmin(user) || (
    _hasSurveyPermission(permissions.userEdit)(user, surveyInfo) &&
    !!_getSurveyUserGroup(userToUpdate, surveyInfo, false)
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