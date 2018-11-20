const R = require('ramda')

const {permissions} = require('../../common/auth/authGroups')

const getUserPermissionsForSurvey = (userAuthGroups, surveyAuthGroups) =>
  R.pipe(
    R.innerJoin((ug, sg) => ug.id === sg.id),
    R.head, // there's only one group per user per survey
    R.propOr([], 'permissions')
  )(userAuthGroups, surveyAuthGroups)

const canEditSurvey = (user, survey) =>
  R.contains(permissions.surveyEdit, getUserPermissionsForSurvey(user.authGroups, survey.authGroups))

module.exports = {
  canEditSurvey,
}
