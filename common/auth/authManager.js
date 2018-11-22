const R = require('ramda')

const {groupNames, permissions} = require('./authGroups')

const isSystemAdmin = user => R.any(
  group => group.name === groupNames.systemAdmin,
  user.authGroups
)

const getSurveyUserPermissions = (user, surveyInfo) => {
  return R.pipe(
    R.innerJoin((ug, sg) => ug.id === sg.id),
    R.head, // there's only one group per user per survey
    R.propOr([], 'permissions'),
  )(user.authGroups, R.pathOr([], ['authGroups'], surveyInfo))
}

const hasPermission = permission => {
  const fn = (user, surveyInfo) =>
    user && surveyInfo &&
    (isSystemAdmin(user) || R.contains(permission, getSurveyUserPermissions(user, surveyInfo)))
  fn.permissionName = permission

  return fn
}

const canEditSurvey = hasPermission(permissions.surveyEdit)

module.exports = {
  isSystemAdmin,
  canEditSurvey,
}
