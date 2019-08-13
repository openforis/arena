const R = require('ramda')

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

// ======
// ====== Survey
// ======

const getSurveyUserGroups = (user, surveyInfo) => {
  const userGroups = getAuthGroups(user)
  const surveyGroups = getAuthGroups(surveyInfo)
  return R.innerJoin(
    (userGroup, surveyGroup) => AuthGroups.getUuid(userGroup) === AuthGroups.getUuid(surveyGroup),
    userGroups,
    surveyGroups
  )
}

const getSurveyUserPermissions = (user, surveyInfo) =>
  R.pipe(
    getSurveyUserGroups,
    R.head, // there's only one group per user per survey
    R.propOr([], keys.permissions)
  )(user, surveyInfo)

const hasSurveyPermission = (permission) => (user, surveyInfo) =>
  user && surveyInfo && (
    isSystemAdmin(user) ||
    R.includes(permission, getSurveyUserPermissions(user, surveyInfo))
  )

// READ
const canViewSurvey = (user, surveyInfo) =>
  isSystemAdmin(user) ||
  R.pipe(
    getSurveyUserGroups,
    R.isEmpty,
    R.not
  )(user, surveyInfo)

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

// INVITE
const canInviteUsers = hasSurveyPermission(permissions.userInvite)

module.exports = {
  isSystemAdmin,

  // Survey permissions
  canViewSurvey,
  canEditSurvey,

  // Record permissions
  canCreateRecord,
  canEditRecord,
  canViewRecord,

  // User permissions
  canInviteUsers,
}