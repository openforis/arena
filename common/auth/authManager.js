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

const hasPermission = (permission, user, surveyInfo) =>
    user && surveyInfo &&
    (
      isSystemAdmin(user)
      ||
      R.contains(permission, getSurveyUserPermissions(user, surveyInfo))
    )

const canEditSurvey = R.partial(hasPermission, [permissions.surveyEdit])

module.exports = {
  isSystemAdmin,
  canEditSurvey,
  hasPermission
}
