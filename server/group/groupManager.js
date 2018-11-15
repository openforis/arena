const {getUserRolesForSurvey} = require('./groupRepository')
const {roles} = require('../../common/group/defaults')

const canEdit = async function (user, surveyId) {
  const permissions = await getUserRolesForSurvey(user.id, surveyId)
  return permissions.permissions.indexOf('surveyEdit') != -1 // TODO refactor
}

module.exports = {
  canEdit
}
