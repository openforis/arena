const R = require('ramda')

const Survey = require('../survey/survey')
const Record = require('../record/record')
const User = require('../user/user')
const AuthGroups = require('./authGroups')

const {
  groupNames,
  permissions,
  keys,
  getAuthGroups,
} = AuthGroups

const isSystemAdmin = user =>
  user &&
  R.any(
    group => AuthGroups.getName(group) === groupNames.systemAdmin
  )(User.getAuthGroups(user))

const isSurveyAdmin = (user, surveyInfo) =>
  AuthGroups.getName(getSurveyUserGroup(user, surveyInfo)) === groupNames.surveyAdmin

// ======
// ====== Survey
// ======

const getSurveyUserGroup = (user, surveyInfo) => {
  if (isSystemAdmin(user))
    return R.pipe(User.getAuthGroups, R.head)(user)

  const userGroups = getAuthGroups(user)
  const surveyGroups = getAuthGroups(surveyInfo)

  const groups = R.innerJoin(
    (userGroup, surveyGroup) => AuthGroups.getUuid(userGroup) === AuthGroups.getUuid(surveyGroup),
    userGroups,
    surveyGroups
  )

  return R.head(groups)
}

const getSurveyUserPermissions = (user, surveyInfo) =>
  R.propOr([], keys.permissions, getSurveyUserGroup(user, surveyInfo))

const hasSurveyPermission = permission => (user, surveyInfo) =>
  user && surveyInfo && (
    isSystemAdmin(user) ||
    R.includes(permission, getSurveyUserPermissions(user, surveyInfo))
  )

// READ
const canViewSurvey = (user, surveyInfo) =>
  isSystemAdmin(user) ||
  !!getSurveyUserGroup(user, surveyInfo)

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

  if (isSystemAdmin(user))
    return true

  const recordDataStep = Record.getStep(record)
  const recordUserPermissions = User.getRecordPermissions(record)(user)

  // level = 'all' or 'own'. If 'own', user can only edit the records that he created
  // If 'all', he can edit all survey's records
  const level = R.path([keys.recordSteps, recordDataStep], recordUserPermissions)

  return level === keys.all || (level === keys.own && Record.getOwnerUuid(record) === User.getUuid(user))
}

// ======
// ====== Users
// ======

// CREATE
const canInviteUsers = hasSurveyPermission(permissions.userInvite)

// READ
const canViewUser = (user, surveyInfo, userToView) => {
  if (isSystemAdmin(user)) {
    return true
  }

  return !!getSurveyUserGroup(user, surveyInfo) && !!getSurveyUserGroup(userToView, surveyInfo)
}

// EDIT
const canEditUser = (user, surveyInfo, userToUpdate) => {
  // user is systemAdmin
  if (isSystemAdmin(user)) {
    return true
  }

  // user is userToUpdate
  if (User.getUuid(user) === User.getUuid(userToUpdate)) {
    return true
  }

  // user is surveyAdmin of userToUpdate
  return isSurveyAdmin(user, surveyInfo) && !!getSurveyUserGroup(userToUpdate, surveyInfo)
}

const canEditUserGroupAndEmail = (user, surveyInfo, userToUpdate) => {
  if (isSystemAdmin(user)) {
    return true
  }

  // Check if userToUpdate has a group in survey
  const hasGroup = AuthGroups.getAuthGroups(userToUpdate).some(
    g => AuthGroups.getSurveyUuid(g) === Survey.getUuid(surveyInfo)
  )
  const sameUser = User.getUuid(user) === User.getUuid(userToUpdate)

  return (sameUser && isSurveyAdmin(userToUpdate, surveyInfo)) ||
    (!sameUser && isSurveyAdmin(user, surveyInfo) && hasGroup)
}

module.exports = {
  isSystemAdmin,
  isSurveyAdmin,
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
  canEditUserGroupAndEmail,
}