const R = require('ramda')

const Record = require('../record/record')
const User = require('../user/user')

const {
  groupNames,
  permissions,
  keys,
} = require('./authGroups')

const isSystemAdmin = user => R.any(
  group => group.name === groupNames.systemAdmin,
  user.authGroups
)

// Survey

const getSurveyUserPermissions = (user, surveyInfo) => {
  return R.pipe(
    R.innerJoin((ug, sg) => ug.id === sg.id),
    R.head, // there's only one group per user per survey
    R.propOr([], keys.permissions)
  )(user.authGroups, R.pathOr([], [keys.authGroups], surveyInfo))
}

const hasSurveyPermission = (permission) => (user, surveyInfo) =>
  user && surveyInfo && (
    isSystemAdmin(user) ||
    R.includes(permission, getSurveyUserPermissions(user, surveyInfo)))

const canEditSurvey = hasSurveyPermission(permissions.surveyEdit)

// Record

const canEditRecord = (user, record) => {
  if (isSystemAdmin(user)) return true

  const recordDataStep = Record.getStep(record)
  const recordUserPermissions = User.getRecordPermissions(record)(user)

  // level = 'all' or 'own'. If 'own', user can only edit the records that he created
  // If 'all', he can edit all survey's records
  const level = R.path([keys.dataSteps, recordDataStep], recordUserPermissions)

  return level === keys.all || (level === keys.own && Record.getOwnerId(record) === user.id)
}

const canCreateRecord = hasSurveyPermission(permissions.recordCreate)

// const canViewRecord = hasSurveyPermission(permissions.recordView)

module.exports = {
  isSystemAdmin,

  // Survey permissions
  canEditSurvey,

  // Record permissions
  canCreateRecord,
  canEditRecord,
}
