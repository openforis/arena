const R = require('ramda')

const {getUserGroups, getSurveyGroups} = require('./authGroupRepository')

getUserPermissionsForSurvey = async (userId, surveyId) =>
  R.pipe(
    R.innerJoin((ug, sg) => ug.id === sg.id),
    R.head, // there's only one group per user per survey
    R.propOr([], 'permissions')
  )(await getUserGroups(userId), await getSurveyGroups(surveyId))

const canEditSurvey = async (user, surveyId) =>
  R.contains('surveyEdit', await getUserPermissionsForSurvey(user, surveyId))

module.exports = {
  getUserPermissionsForSurvey,
  canEditSurvey,
}
