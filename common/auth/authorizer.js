const R = require('ramda')

const Record = require('../record/record')
const Survey = require('../survey/survey')
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
  R.pipe(
    getSurveyUserGroup,
    R.head, // there's only one group per user per survey
    R.propOr([], keys.permissions)
  )(user, surveyInfo)

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
const canViewUser = (user, userToEdit) => {
  if (isSystemAdmin(user)) {
    return true
  }

  const userGroups = User.getAuthGroups(user)
  const userToEditGroups = User.getAuthGroups(userToEdit)

  const commonGroups = R.innerJoin(
    (g1, g2) => AuthGroups.getSurveyId(g1) === AuthGroups.getSurveyId(g2),
    userGroups,
    userToEditGroups
  )

  return !R.isEmpty(commonGroups)
}

// EDIT
const canEditUser = (user, userToEdit) => {
  // user is systemAdmin
  if (isSystemAdmin(user)) {
    return true
  }

  // user is userToEdit
  if (User.getUuid(user) === User.getUuid(userToEdit)) {
    return true
  }

  // user is surveyAdmin of one of userToEdit's surveys
  const commonSurveys = R.innerJoin(
    (g1, g2) => (
      AuthGroups.getName(g1) === AuthGroups.groupNames.surveyAdmin &&
      AuthGroups.getSurveyId(g1) === AuthGroups.getSurveyId(g2)
    ),
    User.getAuthGroups(user),
    User.getAuthGroups(userToEdit)
  )

  return !!commonSurveys.length
}

const canEditUserGroup = (user, { userToUpdate, survey }) => {
  if (isSystemAdmin(user)) {
    return true
  }

  // Check if user has a group in survey
  const hasRole = !!AuthGroups.getAuthGroups(userToUpdate).find(
    g => AuthGroups.getSurveyId(g) === Survey.getId(survey)
  )

  const surveyInfo = Survey.getSurveyInfo(survey)
  const sameUser = User.getUuid(user) === User.getUuid(userToUpdate)

  return (!sameUser && isSurveyAdmin(user, surveyInfo) && hasRole) ||
    (sameUser && isSurveyAdmin(userToUpdate, surveyInfo))
}

// const canEditUser__ = (user, userToEdit) => {
//   const newGroup = await AuthGroupRepository.fetchGroupByUuid(newGroupUuid)
//   const surveyId = AuthGroups.getSurveyId(newGroup)
//
//   // const userGroups = await AuthGroupRepository.fetchUserGroups(userUuid)
//   // const oldGroup = userGroups.find(g => AuthGroups.getSurveyId(g) === surveyId)
//
//   // if (oldGroup) {
//   await UserRepository.updateUser(userUuid, name)
//   // await AuthGroupRepository.updateUserGroup(AuthGroups.getUuid(oldGroup), newGroupUuid, userUuid)
//   await AuthGroupRepository.updateUserGroup(surveyId, userUuid, newGroupUuid)
// }

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
  canEditUserGroup,
}