const R = require('ramda')

const Survey = require('../survey/survey')
const Record = require('../record/record')
const User = require('../user/user')
const AuthGroups = require('./authGroups')

const {
  permissions,
  keys,
  getAuthGroups,
} = AuthGroups

const isSurveyAdmin = (user, surveyInfo) =>
  Survey.isAuthGroupAdmin(getSurveyUserGroup(user, surveyInfo))(surveyInfo)

// ======
// ====== Survey
// ======

const getSurveyUserGroup = (user, surveyInfo) => {
  if (User.isSystemAdmin(user))
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
    User.isSystemAdmin(user) ||
    R.includes(permission, getSurveyUserPermissions(user, surveyInfo))
  )

// READ
const canViewSurvey = (user, surveyInfo) =>
  User.isSystemAdmin(user) ||
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
  if (User.isSystemAdmin(user)) {
    return true
  }

  return !!getSurveyUserGroup(user, surveyInfo) && !!getSurveyUserGroup(userToView, surveyInfo)
}

// EDIT
const isSurveyUser = (surveyInfo, user) => AuthGroups.getAuthGroups(user).some(
  g => AuthGroups.getSurveyUuid(g) === Survey.getUuid(surveyInfo)
)

const canEditUser = (user, surveyInfo, userToUpdate) => (
  User.hasAccepted(userToUpdate) && (
    User.isSystemAdmin(user) ||
    User.getUuid(user) === User.getUuid(userToUpdate) ||
    (
      isSurveyAdmin(user, surveyInfo) &&
      isSurveyUser(surveyInfo, userToUpdate)
    )
  )
)

const canEditUserEmail = (user, surveyInfo, userToUpdate) => (
  User.isSystemAdmin(user) ||
  (
    isSurveyAdmin(user, surveyInfo) &&
    isSurveyUser(surveyInfo, userToUpdate)
  )
)

const canEditUserGroup = (user, surveyInfo, userToUpdate) => {
  return (
    !User.isEqual(user)(userToUpdate) && (
      User.isSystemAdmin(user) ||
      (
        isSurveyAdmin(user, surveyInfo) &&
        isSurveyUser(surveyInfo, userToUpdate)
      )
    )
  )
}

module.exports = {
  isSystemAdmin: () => {},
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
}