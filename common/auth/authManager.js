const R = require('ramda')

const {groupNames, permissions} = require('./authGroups')

const isSystemAdmin = user => R.any(
  group => group.name === groupNames.systemAdmin,
  user.authGroups
)

const surveyAdminGroup = (survey) => R.pipe(
  R.path(['info', 'authGroups']),
  R.find(R.propEq('name', groupNames.surveyAdmin))
)(survey)

const getSurveyUserPermissions = (user, survey) => {
  return R.pipe(
    R.innerJoin((ug, sg) => ug.id === sg.id),
    R.head, // there's only one group per user per survey
    R.propOr([], 'permissions'),
  )(user.authGroups, R.pathOr([], ['info', 'authGroups'], survey))
}

const hasPermission = (permission) => (user, survey) =>
  user && survey
    ? (isSystemAdmin(user) || R.contains(permission, getSurveyUserPermissions(user, survey)))
    : false

// const hasPermission = (user, survey, permission) =>
//   isSystemAdmin(user)
//   || R.contains(permission, getUserPermissionsForSurvey(user, survey))

const canEditSurvey = hasPermission(permissions.surveyEdit)

module.exports = {
  isSystemAdmin,
  canEditSurvey,
  surveyAdminGroup,
  // canInviteUsers
}
