const R = require('ramda')

const Survey = require('../survey/survey')
const Record = require('../record/record')
const User = require('../user/user')
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

const _getNonSystemAdminSurveyUserGroup = (user, surveyInfo) =>
  AuthGroups.getAuthGroups(user).find(g => AuthGroups.getSurveyUuid(g) === Survey.getUuid(surveyInfo))

const getSurveyUserGroup = (user, surveyInfo) => {
  if (User.isSystemAdmin(user)) {
    return R.pipe(User.getAuthGroups, R.head)(user)
  }
  return _getNonSystemAdminSurveyUserGroup(user, surveyInfo)
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

// ======
// ====== Users
// ======

// CREATE
const canInviteUsers = hasSurveyPermission(permissions.userInvite)

// READ
const canViewUser = (user, surveyInfo, userToView) => {
  return User.isSystemAdmin(user) || (
    !!getSurveyUserGroup(user, surveyInfo) && !!getSurveyUserGroup(userToView, surveyInfo)
  )
}

// EDIT
const _hasUserAccess = (user, surveyInfo, userToUpdate) =>
  User.isSystemAdmin(user) || (
    _isSurveyAdmin(user, surveyInfo) &&
    !!_getNonSystemAdminSurveyUserGroup(userToUpdate, surveyInfo)
  )

const canEditUser = (user, surveyInfo, userToUpdate) => (
  User.hasAccepted(userToUpdate) && (
    User.isEqual(user)(userToUpdate) || _hasUserAccess(user, surveyInfo, userToUpdate)
  )
)

const canEditUserEmail = _hasUserAccess

const canEditUserGroup = (user, surveyInfo, userToUpdate) => (
  !User.isEqual(user)(userToUpdate) && _hasUserAccess(user, surveyInfo, userToUpdate)
)

const canRemoveUser = (user, surveyInfo, userToRemove) => (
  !User.isEqual(user)(userToRemove) &&
  !User.isSystemAdmin(userToRemove) &&
  _hasUserAccess(user, surveyInfo, userToRemove)
)

module.exports = {
  getSurveyUserGroup,

  // Survey permissions
  canViewSurvey,
  canEditSurvey,

  // Record permissions
  canCreateRecord,
  canEditRecord,
  canViewRecord,

  // User permissions
  canInviteUsers,
  canViewUser,
  canEditUser,
  canEditUserEmail,
  canEditUserGroup,
  canRemoveUser,
}