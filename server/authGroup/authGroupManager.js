const R = require('ramda')

const {getUserGroups, getSurveyGroups} = require('./authGroupRepository')
const {permissions} = require('../../common/auth/authGroups')

const getUserPermissionsForSurvey = async (userId, surveyId) =>
  R.pipe(
    R.innerJoin((ug, sg) => ug.id === sg.id),
    R.head, // there's only one group per user per survey
    R.propOr([], 'permissions')
  )(await getUserGroups(userId), await getSurveyGroups(surveyId))

const canEditSurvey = async (userId, surveyId) =>
  R.contains(permissions.surveyEdit, await getUserPermissionsForSurvey(userId, surveyId))

module.exports = {
  // getUserPermissionsForSurvey,
  canEditSurvey,
}
