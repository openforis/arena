const R = require('ramda')

const Record = require('../record/record')
const User = require('../user/user')

const {
  groupNames,
  permissions,
  keys,
  getAuthGroups,
} = require('./authGroups')

const isSystemAdmin = user =>
  user &&
  R.any(
    group => group.name === groupNames.systemAdmin
  )(user.authGroups)

// ======
// ====== Survey
// ======

const getSurveyUserGroups = (user, surveyInfo) => {
  const userGroups = getAuthGroups(user)
  const surveyGroups = getAuthGroups(surveyInfo)
  return R.innerJoin(
    (userGroup, surveyGroup) => userGroup.id === surveyGroup.id,
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

  return level === keys.all || (level === keys.own && Record.getOwnerId(record) === user.id)
}

module.exports = {
  isSystemAdmin,

  // Survey permissions
  canViewSurvey,
  canEditSurvey,

  // Record permissions
  canCreateRecord,
  canEditRecord,
  canViewRecord,
}