const R = require('ramda')

const Record = require('../record/record')
const User = require('../user/user')

const {
  groupNames,
  permissions,
  keys,
} = require('./authGroups')

const isSystemAdmin = user => R.any(
  group => group.name === groupNames.systemAdmin
)(user.authGroups)

// Survey

const getSurveyUserGroups = R.innerJoin((userGroup, surveyGroup) => userGroup.id === surveyGroup.id)

const getSurveyUserPermissions = (user, surveyInfo) =>
  R.pipe(
    getSurveyUserGroups,
    R.head, // there's only one group per user per survey
    R.propOr([], keys.permissions)
  )(user.authGroups, R.pathOr([], [keys.authGroups], surveyInfo))

const hasSurveyPermission = (permission) => (user, surveyInfo) =>
  user && surveyInfo && (
    isSystemAdmin(user) ||
    R.includes(permission, getSurveyUserPermissions(user, surveyInfo)))

const canEditSurvey = hasSurveyPermission(permissions.surveyEdit)

/**
 * User can view the survey - checks that the given user belongs to a group for the given survey
 *
 * @param user
 * @param surveyInfo
 */
const canViewSurvey = (user, surveyInfo) =>
  R.pipe(
    getSurveyUserGroups,
    R.isEmpty, R.not
  )(user.authGroups, R.pathOr([], [keys.authGroups], surveyInfo))

// Record

/**
 * User can the given record
 *
 * @param user
 * @param record
 */
const canEditRecord = (user, record) => {
  if (isSystemAdmin(user)) return true

  const recordDataStep = Record.getStep(record)
  const recordUserPermissions = User.getRecordPermissions(record)(user)

  // level = 'all' or 'own'. If 'own', user can only edit the records that he created
  // If 'all', he can edit all survey's records
  const level = R.path([keys.recordSteps, recordDataStep], recordUserPermissions)

  return level === keys.all || (level === keys.own && Record.getOwnerId(record) === user.id)
}

/**
 * User can create a new record in a given survey(info)
 *
 * @param user
 * @param surveyInfo
 */
const canCreateRecord = hasSurveyPermission(permissions.recordCreate)

const canViewRecord = hasSurveyPermission(permissions.recordView)

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